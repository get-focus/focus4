import {range} from "lodash";
import moment from "moment";
import {useCallback, useMemo} from "react";

import {ToBem} from "@focus4/styling";
import {CalendarCss} from "../__style__/calendar.css";

import {Day} from "./day";

export interface MonthProps {
    disabledDates?: Date[];
    enabledDates?: Date[];
    maxDate?: Date;
    minDate?: Date;
    onDayClick: (day: number) => void;
    selectedDate: Date;
    sundayFirstDayOfWeek: boolean;
    theme: ToBem<CalendarCss>;
    viewDate: Date;
}

export function Month({
    disabledDates = [],
    enabledDates = [],
    maxDate,
    minDate,
    onDayClick,
    selectedDate,
    sundayFirstDayOfWeek,
    theme,
    viewDate
}: MonthProps) {
    const isDayDisabled = useCallback(
        (date: Date) => {
            const compareDate = (compDate: Date) => date.getTime() === compDate.getTime();
            const dateInDisabled = disabledDates.filter(compareDate).length > 0;
            const dateInEnabled = enabledDates.filter(compareDate).length > 0;
            return (
                (minDate && !(date >= minDate)) ||
                (maxDate && !(date <= maxDate)) ||
                (enabledDates.length > 0 && !dateInEnabled) ||
                dateInDisabled
            );
        },
        [disabledDates, enabledDates, maxDate, minDate]
    );

    const days = useMemo(
        () =>
            range(1, getDaysInMonth(viewDate) + 1).map(i => {
                const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), i);
                return (
                    <Day
                        key={i}
                        day={i}
                        disabled={isDayDisabled(date)}
                        onClick={onDayClick}
                        selectedDate={selectedDate}
                        sundayFirstDayOfWeek={sundayFirstDayOfWeek}
                        theme={theme}
                        viewDate={viewDate}
                    />
                );
            }),
        [isDayDisabled, onDayClick, selectedDate, sundayFirstDayOfWeek, theme, viewDate]
    );

    const weeks = useMemo(() => {
        const dayLabels = range(0, 7).map(d => moment(d, "d").format("dd"));
        const source = sundayFirstDayOfWeek ? dayLabels : [...dayLabels.slice(1), dayLabels[0]];
        return source.map((day, i) => <span key={i}>{day}</span>);
    }, [sundayFirstDayOfWeek]);

    const fullMonth = moment(viewDate).format("MMMM");
    const fullYear = viewDate.getFullYear();

    return (
        <div data-react-toolbox="month" className={theme.month()}>
            <span className={theme.title()}>
                {fullMonth} {fullYear}
            </span>
            <div className={theme.week()}>{weeks}</div>
            <div className={theme.days()}>{days}</div>
        </div>
    );
}

function getDaysInMonth(d: Date) {
    const resultDate = new Date(d.getFullYear(), d.getMonth(), 1);
    resultDate.setMonth(resultDate.getMonth() + 1);
    resultDate.setDate(resultDate.getDate() - 1);
    return resultDate.getDate();
}
