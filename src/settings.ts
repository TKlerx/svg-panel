"use strict";

import powerbi from "powerbi-visuals-api";
import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsCards = formattingSettings.Cards;
import FormattingSettingsModel = formattingSettings.Model;
import FormattingSettingsSlice = formattingSettings.Slice;

type EnumMember = powerbi.IEnumMember;
type ThemeColorData = powerbi.ThemeColorData;

const comparisonItems: EnumMember[] = [
    { value: ">", displayName: ">" },
    { value: ">=", displayName: ">=" },
    { value: "=", displayName: "=" },
    { value: "<=", displayName: "<=" },
    { value: "<", displayName: "<" }
];

const calculateItems: EnumMember[] = [
    { value: "absolute", displayName: "Absolute value" },
    { value: "percentage", displayName: "Percentage" },
    { value: "modifier", displayName: "Modifier" }
];

const labelStyleItems: EnumMember[] = [
    { value: "category", displayName: "Data column" },
    { value: "value", displayName: "Data value" },
    { value: "area", displayName: "Area name" },
    { value: "both", displayName: "Column and value" },
    { value: "both2", displayName: "Area and value" }
];

const labelPositionItems: EnumMember[] = [
    { value: "top", displayName: "Top left" },
    { value: "centroid", displayName: "Middle" },
    { value: "best", displayName: "Best" }
];

const toolbarScaleItems: EnumMember[] = [
    { value: "0.5", displayName: "50%" },
    { value: "0.75", displayName: "75%" },
    { value: "1", displayName: "100%" },
    { value: "1.25", displayName: "125%" },
    { value: "1.5", displayName: "150%" },
    { value: "1.75", displayName: "175%" },
    { value: "2", displayName: "200%" }
];

const colorBlindItems: EnumMember[] = [
    { value: "Normal", displayName: "Normal" },
    { value: "Protanopia", displayName: "Protanopia" },
    { value: "Protanomaly", displayName: "Protanomaly" },
    { value: "Deuteranopia", displayName: "Deuteranopia" },
    { value: "Deuteranomaly", displayName: "Deuteranomaly" },
    { value: "Tritanopia", displayName: "Tritanopia" },
    { value: "Tritanomaly", displayName: "Tritanomaly" },
    { value: "Achromatopsia", displayName: "Achromatopsia" },
    { value: "Achromatomaly", displayName: "Achromatomaly" },
    { value: "LowContrast", displayName: "Low Contrast" }
];

class GeneralCardSettings extends FormattingSettingsCard {
    showUnmatched = new formattingSettings.ToggleSwitch({
        name: "showUnmatched",
        displayName: "Unmatched areas",
        value: true
    });

    showMatchCount = new formattingSettings.ToggleSwitch({
        name: "showMatchCount",
        displayName: "Match count label",
        value: true
    });

    showDiagnostic = new formattingSettings.ToggleSwitch({
        name: "showDiagnostic",
        displayName: "Diagnostic console log",
        value: false
    });

    name = "general";
    displayName = "General";
    analyticsPane = false;
    slices: FormattingSettingsSlice[] = [this.showUnmatched, this.showMatchCount, this.showDiagnostic];
}

class ToolbarCardSettings extends FormattingSettingsCard {
    keep = new formattingSettings.ToggleSwitch({
        name: "keep",
        displayName: "Keep visible",
        value: false
    });

    zoom = new formattingSettings.ToggleSwitch({
        name: "zoom",
        displayName: "Zoom",
        value: true
    });

    filter = new formattingSettings.ToggleSwitch({
        name: "filter",
        displayName: "Filter on map change",
        value: false
    });

    scale = new formattingSettings.ItemDropdown({
        name: "scale",
        displayName: "Scale",
        value: toolbarScaleItems[2],
        items: toolbarScaleItems
    });

    name = "toolbar";
    displayName = "Toolbar";
    analyticsPane = false;
    slices: FormattingSettingsSlice[] = [this.keep, this.zoom, this.filter, this.scale];
}

class DataPointCardSettings extends FormattingSettingsCard {
    borders = new formattingSettings.ToggleSwitch({
        name: "borders",
        displayName: "Borders",
        value: true
    });

    unmatchedFill = new formattingSettings.ColorPicker({
        name: "unmatchedFill",
        displayName: "Unmatched color",
        value: { value: "#000000" },
        isNoFillItemSupported: true
    });

    defaultFill = new formattingSettings.ColorPicker({
        name: "defaultFill",
        displayName: "Default color",
        value: { value: "#01B8AA" }
    });

    showAll = new formattingSettings.ToggleSwitch({
        name: "showAll",
        displayName: "Show all",
        value: false
    });

    name = "dataPoint";
    displayName = "Data Colors";
    analyticsPane = false;
    slices: FormattingSettingsSlice[] = [this.borders, this.unmatchedFill, this.defaultFill, this.showAll];
}

class StatesCardSettings extends FormattingSettingsCard {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show",
        value: true
    });

    comparison = new formattingSettings.ItemDropdown({
        name: "comparison",
        displayName: "Comparison",
        value: comparisonItems[3],
        items: comparisonItems
    });

    calculate = new formattingSettings.ItemDropdown({
        name: "calculate",
        displayName: "Value type",
        value: calculateItems[0],
        items: calculateItems
    });

    saturate = new formattingSettings.ToggleSwitch({
        name: "saturate",
        displayName: "Saturate",
        value: false
    });

    saturateMin = new formattingSettings.NumUpDown({
        name: "saturateMin",
        displayName: "Min % saturation",
        value: 0
    });

    saturateMax = new formattingSettings.NumUpDown({
        name: "saturateMax",
        displayName: "Max % saturation",
        value: 0
    });

    manualState1Fill = new formattingSettings.ColorPicker({
        name: "manualState1Fill",
        displayName: "State A",
        value: { value: "#01B8AA" },
        isNoFillItemSupported: true
    });

    manualState1 = new formattingSettings.NumUpDown({
        name: "manualState1",
        displayName: "State A value",
        value: 0
    });

    manualState2Fill = new formattingSettings.ColorPicker({
        name: "manualState2Fill",
        displayName: "State B",
        value: { value: "#374649" },
        isNoFillItemSupported: true
    });

    manualState2 = new formattingSettings.NumUpDown({
        name: "manualState2",
        displayName: "State B value",
        value: 0
    });

    manualState3Fill = new formattingSettings.ColorPicker({
        name: "manualState3Fill",
        displayName: "State C",
        value: { value: "#FD625E" },
        isNoFillItemSupported: true
    });

    manualState3 = new formattingSettings.NumUpDown({
        name: "manualState3",
        displayName: "State C value",
        value: 0
    });

    manualState4Fill = new formattingSettings.ColorPicker({
        name: "manualState4Fill",
        displayName: "State D",
        value: { value: "#F2C80F" },
        isNoFillItemSupported: true
    });

    manualState4 = new formattingSettings.NumUpDown({
        name: "manualState4",
        displayName: "State D value",
        value: 0
    });

    manualState5Fill = new formattingSettings.ColorPicker({
        name: "manualState5Fill",
        displayName: "State E",
        value: { value: "#5F6B6D" },
        isNoFillItemSupported: true
    });

    manualState5 = new formattingSettings.NumUpDown({
        name: "manualState5",
        displayName: "State E value",
        value: 0
    });

    name = "states";
    displayName = "States";
    analyticsPane = false;
    topLevelSlice = this.show;
    slices: FormattingSettingsSlice[] = [
        this.comparison,
        this.calculate,
        this.saturate,
        this.saturateMin,
        this.saturateMax,
        this.manualState1Fill,
        this.manualState1,
        this.manualState2Fill,
        this.manualState2,
        this.manualState3Fill,
        this.manualState3,
        this.manualState4Fill,
        this.manualState4,
        this.manualState5Fill,
        this.manualState5
    ];

    onPreProcess(): void {
        const enabled = this.show.value;
        this.comparison.visible = enabled;
        this.calculate.visible = enabled;
        this.saturate.visible = enabled;
        this.saturateMin.visible = enabled && this.saturate.value;
        this.saturateMax.visible = enabled && this.saturate.value;
        this.manualState1Fill.visible = enabled;
        this.manualState1.visible = enabled;
        this.manualState2Fill.visible = enabled;
        this.manualState2.visible = enabled;
        this.manualState3Fill.visible = enabled;
        this.manualState3.visible = enabled;
        this.manualState4Fill.visible = enabled;
        this.manualState4.visible = enabled;
        this.manualState5Fill.visible = enabled;
        this.manualState5.visible = enabled;
    }
}

class DataLabelsCardSettings extends FormattingSettingsCard {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show",
        value: false
    });

    unmatchedLabels = new formattingSettings.ToggleSwitch({
        name: "unmatchedLabels",
        displayName: "Unmatched labels",
        value: true
    });

    labelStyle = new formattingSettings.ItemDropdown({
        name: "labelStyle",
        displayName: "Display",
        value: labelStyleItems[0],
        items: labelStyleItems
    });

    position = new formattingSettings.ItemDropdown({
        name: "position",
        displayName: "Position",
        value: labelPositionItems[2],
        items: labelPositionItems
    });

    enclose = new formattingSettings.ToggleSwitch({
        name: "enclose",
        displayName: "Enclose in area",
        value: true
    });

    wordWrap = new formattingSettings.ToggleSwitch({
        name: "wordWrap",
        displayName: "Word wrap",
        value: true
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Text size",
        value: 9
    });

    name = "dataLabels";
    displayName = "Data labels";
    analyticsPane = false;
    topLevelSlice = this.show;
    slices: FormattingSettingsSlice[] = [
        this.unmatchedLabels,
        this.labelStyle,
        this.position,
        this.enclose,
        this.wordWrap,
        this.fontSize
    ];

    onPreProcess(): void {
        const enabled = this.show.value;
        this.unmatchedLabels.visible = enabled;
        this.labelStyle.visible = enabled;
        this.position.visible = enabled;
        this.enclose.visible = enabled;
        this.wordWrap.visible = enabled;
        this.fontSize.visible = enabled;
    }
}

class ColorBlindCardSettings extends FormattingSettingsCard {
    vision = new formattingSettings.ItemDropdown({
        name: "vision",
        displayName: "Vision",
        value: colorBlindItems[0],
        items: colorBlindItems
    });

    name = "colorBlind";
    displayName = "Color Blindness";
    analyticsPane = false;
    slices: FormattingSettingsSlice[] = [this.vision];
}

export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    general = new GeneralCardSettings();
    toolbar = new ToolbarCardSettings();
    dataPoint = new DataPointCardSettings();
    states = new StatesCardSettings();
    dataLabels = new DataLabelsCardSettings();
    colorBlind = new ColorBlindCardSettings();

    cards: FormattingSettingsCards[] = [
        this.general,
        this.toolbar,
        this.dataPoint,
        this.states,
        this.dataLabels,
        this.colorBlind
    ];
}
