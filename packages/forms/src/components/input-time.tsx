import {uniqueId} from "lodash";
import {action, observable} from "mobx";
import {observer} from "mobx-react";
import moment from "moment-timezone";
import {Component, KeyboardEvent} from "react";

import {CSSProp, themr} from "@focus4/styling";
import {Clock, ClockCss, IconButton} from "@focus4/toolbox";

import {Input, InputProps} from "./input";

import inputTimeCss, {InputTimeCss} from "./__style__/input-time.css";
export {inputTimeCss};

const Theme = themr("inputTime", inputTimeCss);

/** Props de l'InputTime. */
export interface InputTimeProps {
    /** CSS pour le composant Clock. */
    clockTheme?: CSSProp<ClockCss>;
    /** Composant affiché depuis la gauche ou la droite. */
    displayFrom?: "left" | "right";
    /** Format de la date dans l'input. */
    inputFormat?: string;
    /** Props de l'input. */
    inputProps?: Omit<InputProps<"string">, "mask" | "onChange" | "onKeyDown" | "onFocus" | "type" | "value">;
    /** Appelé lorsque l'heure change. */
    onChange: (time: string | undefined) => void;
    /** CSS. */
    theme?: CSSProp<InputTimeCss>;
    /** Valeur. */
    value: string | undefined;
    /** Code Timezone que l'on souhaite appliquer au InputTime dans le cas d'une Timezone différente de celle du navigateur (https://momentjs.com/timezone/) */
    timezoneCode?: string;
}

/** Composant d'input avec une horloge (React-Toolbox). Diffère du TimePicker classique car il n'est pas affiché en plein écran et autorise la saisie manuelle. */
@observer
export class InputTime extends Component<InputTimeProps> {
    protected clock?: HTMLDivElement | null;

    /** Id unique de l'input time, pour gérer la fermeture en cliquant à l'extérieur. */
    protected readonly _inputTimeId = uniqueId("input-time-");

    /** Heure actuelle. */
    @observable protected time = this.toMoment(this.props.value);

    /** Contenu du champ texte. */
    @observable protected timeText = this.formatTime(this.props.value);

    /** Affiche l'horloge. */
    @observable protected showClock = false;

    /** Mode de l'horloge. */
    @observable protected clockDisplay = "hours" as "hours" | "minutes";

    /** Position de l'horloge. */
    @observable protected clockPosition?: "up" | "down";

    componentDidMount() {
        document.addEventListener("mousedown", this.onDocumentClick);
    }

    @action
    UNSAFE_componentWillReceiveProps({value}: InputTimeProps) {
        this.time = this.toMoment(value);
        this.timeText = this.formatTime(value);
    }

    // Met à jour la position du calendrier.
    componentDidUpdate() {
        if (this.clock && this.showClock) {
            const client = this.clock.getBoundingClientRect();
            const screenHeight = window.innerHeight || document.documentElement!.offsetHeight;
            if (!this.clockPosition) {
                if (client.top + client.height > screenHeight) {
                    this.clockPosition = "up";
                } else {
                    this.clockPosition = "down";
                }
            }
        } else {
            this.clockPosition = undefined;
        }
    }

    componentWillUnmount() {
        document.removeEventListener("mousedown", this.onDocumentClick);
    }

    /** Convertit le texte en objet momentJS. */
    toMoment(value?: string) {
        const {timezoneCode} = this.props;
        if (isISOString(value)) {
            if (timezoneCode && moment.tz.zone(timezoneCode)) {
                return moment(value, moment.ISO_8601).tz(timezoneCode);
            }
            return moment(value, moment.ISO_8601);
        } else {
            return moment();
        }
    }

    /** Recupère la date pour le TimePicker */
    getTime() {
        const {timezoneCode} = this.props;
        // Vérifie que la timezone existe
        if (timezoneCode && moment.tz.zone(timezoneCode)) {
            return getPickerTime(this.time.toDate(), timezoneCode);
        }
        return this.time.toDate();
    }

    /** Formatte l'heure (ISO String) en entrée. */
    formatTime(value?: string) {
        const {inputFormat = "HH:mm", timezoneCode} = this.props;
        if (isISOString(value)) {
            if (timezoneCode && moment.tz.zone(timezoneCode)) {
                return moment(value, moment.ISO_8601).tz(timezoneCode).format(inputFormat);
            }
            return moment(value, moment.ISO_8601).format(inputFormat);
        } else {
            return value;
        }
    }

    /** Ferme le calendrier lorsqu'on clic à l'extérieur du picker. */
    @action.bound
    onDocumentClick({target}: Event) {
        let parent = target as HTMLElement | null;

        while (parent && parent.getAttribute("data-id") !== this._inputTimeId) {
            parent = parent.parentElement;
        }

        if (this.showClock && !parent) {
            this.showClock = false;
            this.onInputBlur();
        }
    }

    /** Appelé lorsqu'on quitte le champ texte. */
    @action.bound
    onInputBlur() {
        const {inputFormat = "HH:mm", onChange} = this.props;
        const text = (this.timeText || "").trim() || undefined;

        const time = moment(text, inputFormat, true);

        const dateTime = this.time.clone();
        dateTime.hours(time.hours());
        dateTime.minutes(time.minutes());

        if (dateTime.isValid()) {
            this.time = dateTime;
            onChange(dateTime.format());
        } else {
            onChange(text);
        }
    }

    /** Au clic sur l'horloge. */
    @action.bound
    onClockChange(time: Date) {
        const {timezoneCode} = this.props;
        // Vérifie que la timezone existe
        if (timezoneCode && moment.tz.zone(timezoneCode)) {
            time = getTimezoneTime(time, timezoneCode);
        }
        return this.props.onChange(moment(time).format());
    }

    @action.bound
    onHandMoved() {
        if (this.clockDisplay === "hours") {
            this.clockDisplay = "minutes";
        } else {
            this.clockDisplay = "hours";
            this.showClock = false;
        }
    }

    /** Ferme l'horloge lorsqu'on appuie sur Entrée ou Tab. */
    @action.bound
    handleKeyDown({key}: KeyboardEvent) {
        if (key === "Tab" || key === "Enter") {
            this.showClock = false;
            this.onInputBlur();
        }
    }

    render() {
        const {theme: pTheme, inputFormat = "HH:mm", displayFrom = "left", inputProps = {}, clockTheme} = this.props;
        return (
            <Theme theme={pTheme}>
                {theme => (
                    <div data-focus="input-time" data-id={this._inputTimeId} className={theme.input()}>
                        <Input
                            {...inputProps}
                            {...{autoComplete: "off"}}
                            mask={{pattern: inputFormat.replace(/\w/g, "1")}}
                            onChange={value => (this.timeText = value)}
                            onKeyDown={this.handleKeyDown}
                            onFocus={() => (this.showClock = true)}
                            type="string"
                            value={this.timeText || ""}
                        />
                        {this.showClock ? (
                            <div
                                ref={clo => (this.clock = clo)}
                                className={theme.clock({
                                    [this.clockPosition ?? "down"]: true,
                                    fromRight: displayFrom == "right"
                                })}
                            >
                                <header className={theme.header()}>
                                    <span
                                        id="hours"
                                        className={theme.hours({selected: this.clockDisplay === "hours"})}
                                        onClick={() => (this.clockDisplay = "hours")}
                                    >
                                        {`0${this.time.hours()}`.slice(-2)}
                                    </span>
                                    <span className={theme.separator()}>:</span>
                                    <span
                                        id="minutes"
                                        className={theme.minutes({selected: this.clockDisplay === "minutes"})}
                                        onClick={() => (this.clockDisplay = "minutes")}
                                    >
                                        {`0${this.time.minutes()}`.slice(-2)}
                                    </span>
                                    <IconButton
                                        icon="clear"
                                        theme={{toggle: theme.toggle()}}
                                        onClick={() => (this.showClock = false)}
                                    />
                                </header>
                                <Clock
                                    display={this.clockDisplay}
                                    format="24hr"
                                    onChange={this.onClockChange}
                                    onHandMoved={this.onHandMoved}
                                    theme={clockTheme}
                                    time={this.getTime()}
                                />
                            </div>
                        ) : null}
                    </div>
                )}
            </Theme>
        );
    }
}

/** Détermine si une valeur est un ISO String. */
function isISOString(value?: string) {
    return moment(value, moment.ISO_8601, true).isValid();
}

/** Détermine la date pour le picker en prenant en compte la timezone */
function getPickerTime(tzDate: Date, timezoneCode: string) {
    const tzUTCOffset = moment.tz(tzDate, timezoneCode).utcOffset();
    const utcDate = new Date();
    utcDate.setTime(tzDate.getTime() + tzUTCOffset * 60000);

    const pickerDate = new Date();
    const pickerOffset = pickerDate.getTimezoneOffset();
    pickerDate.setTime(utcDate.getTime() + pickerOffset * 60000);

    return pickerDate;
}

/** Détermine la date à retourner en prenant en compte la timezone */
function getTimezoneTime(pickerDate: Date, timezoneCode: string) {
    const pickerOffset = pickerDate.getTimezoneOffset();
    const utcDate = new Date();
    utcDate.setTime(pickerDate.getTime() - pickerOffset * 60000);

    const tzOffset = moment.tz(pickerDate, timezoneCode).utcOffset();
    const tzDate = new Date();
    tzDate.setTime(utcDate.getTime() - tzOffset * 60000);
    return tzDate;
}
