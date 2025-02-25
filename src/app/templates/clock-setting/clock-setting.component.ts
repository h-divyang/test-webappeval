import {
  Component,
  OnInit,
  Input,
  OnChanges,
  Output,
  EventEmitter,
} from "@angular/core";
import { WidgetService } from "src/app/service/widget.service";
import { ToastrService } from "ngx-toastr";
import { DataService } from "src/app/service/data.service";
import { CommonFunction } from "src/app/service/common-function.service";
import { LayoutRequest, WidgetBackgroundSetting } from "../../util/static-data";
import { LocalStorageService } from "angular-web-storage";
import { WidgetsUtil } from "src/app/util/widgetsUtil";
import * as moment_t from "moment-timezone";
import { Ng4LoadingSpinnerService } from "ng4-loading-spinner";
import { ClockService } from "src/app/service/clock.service";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { CentralSaveService } from "src/app/service/central-save.service";
import { filter } from "rxjs/operators";
import { Components } from "src/app/enum/components.enum";

@Component({
  selector: "app-clock-setting",
  templateUrl: "./clock-setting.component.html",
  styleUrls: ["./clock-setting.component.scss"],
})
export class ClockSettingComponent implements OnInit, OnChanges {
  @Input() clockSettingModal: any;
  @Input() category: string;
  @Input() activeLayout: any;
  @Input() clockWidgetObject: any;
  @Input() changeDetector: any;
  @Output() updateClockEventEmiter = new EventEmitter();

  clockEnabled: boolean;
  greetingsEnabled: boolean = false;
  activeMirrorDetail: any;
  widgetData = null;
  widgetSettingDetails: any;
  clockWidgetData: any;
  activeMirrorDetails: any;
  settingDisplayflag: any;
  clock24hrFormat: boolean = false;
  widget: any;
  defaultClockWidget: void;

  //background widget setting
  widgetType: any;
  widgetBgSetting: any;
  newBgSetting: any;

  currentTimezone: any;
  current_time = "01-01-1970 12:12";
  availableTimeZoneList = moment_t.tz.names();

  clockFormGroup: FormGroup;
  widgetSettings: any;
  widgetLayoutDetails: any;

  constructor(
    private toastr: ToastrService,
    private loadingSpinner: Ng4LoadingSpinnerService,
    private _dataService: DataService,
    private commonFunction: CommonFunction,
    private storage: LocalStorageService,
    private _clockService: ClockService,
    private formBuilder: FormBuilder,
    private _centralSaveService: CentralSaveService
  ) {
    this.activeMirrorDetails = this.storage.get("activeMirrorDetails");
    this.clockFormGroup = this.formBuilder.group({
      timeZoneId: [
        this.activeMirrorDetails.timeZoneId,
        Validators.requiredTrue,
      ],
      isGreetingMessage: [false, Validators.requiredTrue],
    });
  }

  ngOnInit() {
    this._centralSaveService.saveTriggered$.pipe(filter(component => component === Components.CLOCK_SETTING)).subscribe(() => {
      if (this.clockFormGroup.dirty) {
        this.saveClockSettings();
      } else {
        this.clockSettingModal.hide();
      }
      this.clockFormGroup.markAsPristine();
    });
  }

  createClockForm(clockWidget: any) {
    this.clockFormGroup = this.formBuilder.group({
      timeZoneId: [
        clockWidget
          ? clockWidget.timeZoneId
          : this.activeMirrorDetails.timeZoneId,
        Validators.requiredTrue,
      ],
      isGreetingMessage: [
        clockWidget ? clockWidget.isGreetingMessage : false,
        Validators.requiredTrue,
      ],
    });
  }

  ngOnChanges(changes: any) {
    if (
      changes.changeDetector != null &&
      changes.changeDetector.currentValue != undefined
    ) {
      if (this.clockWidgetObject) {
        let timeZoneId =
          this.clockWidgetObject.data.clockWidgetDetail.timeZoneId;
        this.mapCurrentlySelectedTimezone(timeZoneId);
		// Register the CLOCK_SETTING component to listen for save triggers from CentralSaveService.
        this._centralSaveService.registerSave(Components.CLOCK_SETTING);
        this.setBackgroundWidgetDetail();
      }
    }

    if (
      changes.clockWidgetObject != null &&
      changes.clockWidgetObject.currentValue != undefined
    ) {
      this._dataService.getWidgetSettingsLayout().subscribe((data) => {
        this.widgetLayoutDetails = data;
        this.widgetSettings = data.widgetSetting;
      });

      this.activeMirrorDetails = this.storage.get("activeMirrorDetails");
      let timeZoneId = this.clockWidgetObject.data.clockWidgetDetail.timeZoneId;
      this.mapCurrentlySelectedTimezone(timeZoneId);
      this.initializeClockData(this.clockWidgetObject);
    }
  }

  initializeClockData(clockWidget) {
    this.clockWidgetData = clockWidget.data.clockWidgetDetail;
    this.createClockForm(this.clockWidgetData);
  }

  mapCurrentlySelectedTimezone(timeZoneId) {
    this.currentTimezone = timeZoneId;
    let date = new Date();
    let dateFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZoneId,
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    let timeFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timeZoneId,
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
    this.current_time =
      dateFormatter.format(date) + ", " + timeFormatter.format(date);
  }

  setBackgroundWidgetDetail() {
    this.widgetType = this.category;
    let widgetData = this.storage.get("selectedwidget");
    if (widgetData != null) {
      this.widgetBgSetting = widgetData.widgetBackgroundSettingModel;
    }
    this.activeMirrorDetails = this.storage.get("activeMirrorDetails");
  }

  onbgsettingOptions(event) {
    this.newBgSetting = event;
    this.onAddBackgroundSetting();
  }

  onAddBackgroundSetting() {
    const payload = {
      userMirrorId: this.activeMirrorDetails.id,
      mastercategory: [this.clockWidgetObject.widgetMasterCategory],
      widgetBackgroundSettingModel: this.newBgSetting,
    };
    this.commonFunction.updateWidgetSettings(this.newBgSetting, payload);
    this.clockSettingModal.hide();
  }

  dismissModel() {
    this.clockSettingModal.hide();
  }

  selectTimezone() {
    this.mapCurrentlySelectedTimezone(this.clockFormGroup.value.timeZoneId);
  }

  /**
   * @description
   * Triggers a save event for all registered components using `CentralSaveService`.
   * Each registered component will receive a notification to execute its save logic.
   */
  save() {
    this._centralSaveService.triggerSave();
  }

  saveClockSettings() {
    let payload = this.clockFormGroup.value;
    payload["id"] = this.clockWidgetData.id;
    payload["widgetSetting"] = {
      id: this.clockWidgetObject.widgetSettingId,
    };

    this.loadingSpinner.show();
    this._clockService.updateClockSetting(payload).subscribe(
      (res: any) => {
        this.loadingSpinner.hide();
        this.widgetSettings.forEach((widgetPageData) => {
          widgetPageData.widgets.forEach((element) => {
            if (
              element.widgetSettingId === this.clockWidgetObject.widgetSettingId
            ) {
              element.data.clockWidgetDetail = res.object;
            }
          });
        });
        this.widgetLayoutDetails.widgetSetting = this.widgetSettings;
        this.storage.set("activeWidgetDetails", this.widgetLayoutDetails);
        this._dataService.setWidgetSettingsLayout(this.widgetLayoutDetails);
        this.clockSettingModal.hide();
      },
      (err: any) => {
        this.loadingSpinner.hide();
        this.toastr.error(err.error.message, "Error");
      }
    );
  }
}
