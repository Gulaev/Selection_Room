import { Component, Input, Output, EventEmitter, LOCALE_ID, Inject, } from '@angular/core';
import { CalendarDragHelper } from '../../common/calendar-drag-helper/calendar-drag-helper.provider';
import { CalendarResizeHelper } from '../../common/calendar-resize-helper/calendar-resize-helper.provider';
import { CalendarEventTimesChangedEventType, } from '../../common/calendar-event-times-changed-event/calendar-event-times-changed-event.interface';
import { validateEvents, roundToNearest, trackByWeekDayHeaderDate, trackByHourSegment, trackByHour, getMinutesMoved, getDefaultEventEnd, addDaysWithExclusions, isDraggedWithinPeriod, shouldFireDroppedEvent, getWeekViewPeriod, trackByWeekAllDayEvent, trackByWeekTimeEvent, } from '../../common/util/util';
import * as i0 from "@angular/core";
import * as i1 from "../../common/calendar-utils/calendar-utils.provider";
import * as i2 from "../../../date-adapters/date-adapter";
import * as i3 from "@angular/common";
import * as i4 from "angular-resizable-element";
import * as i5 from "angular-draggable-droppable";
import * as i6 from "../../common/click/click.directive";
import * as i7 from "./calendar-week-view-header/calendar-week-view-header.component";
import * as i8 from "./calendar-week-view-event/calendar-week-view-event.component";
import * as i9 from "./calendar-week-view-hour-segment/calendar-week-view-hour-segment.component";
import * as i10 from "./calendar-week-view-current-time-marker/calendar-week-view-current-time-marker.component";
/**
 * Shows all events on a given week. Example usage:
 *
 * ```typescript
 * <mwl-calendar-week-view
 *  [viewDate]="viewDate"
 *  [events]="events">
 * </mwl-calendar-week-view>
 * ```
 */
export class CalendarWeekViewComponent {
    /**
     * @hidden
     */
    constructor(cdr, utils, locale, dateAdapter, element) {
        this.cdr = cdr;
        this.utils = utils;
        this.dateAdapter = dateAdapter;
        this.element = element;
        /**
         * An array of events to display on view
         * The schema is available here: https://github.com/mattlewis92/calendar-utils/blob/c51689985f59a271940e30bc4e2c4e1fee3fcb5c/src/calendarUtils.ts#L49-L63
         */
        this.events = [];
        /**
         * An array of day indexes (0 = sunday, 1 = monday etc) that will be hidden on the view
         */
        this.excludeDays = [];
        /**
         * The placement of the event tooltip
         */
        this.tooltipPlacement = 'auto';
        /**
         * Whether to append tooltips to the body or next to the trigger element
         */
        this.tooltipAppendToBody = true;
        /**
         * The delay in milliseconds before the tooltip should be displayed. If not provided the tooltip
         * will be displayed immediately.
         */
        this.tooltipDelay = null;
        /**
         * The precision to display events.
         * `days` will round event start and end dates to the nearest day and `minutes` will not do this rounding
         */
        this.precision = 'days';
        /**
         * Whether to snap events to a grid when dragging
         */
        this.snapDraggedEvents = true;
        /**
         * The number of segments in an hour. Must divide equally into 60.
         */
        this.hourSegments = 2;
        /**
         * The height in pixels of each hour segment
         */
        this.hourSegmentHeight = 30;
        /**
         * The minimum height in pixels of each event
         */
        this.minimumEventHeight = 30;
        /**
         * The day start hours in 24 hour time. Must be 0-23
         */
        this.dayStartHour = 0;
        /**
         * The day start minutes. Must be 0-59
         */
        this.dayStartMinute = 0;
        /**
         * The day end hours in 24 hour time. Must be 0-23
         */
        this.dayEndHour = 23;
        /**
         * The day end minutes. Must be 0-59
         */
        this.dayEndMinute = 59;
        /**
         * Called when a header week day is clicked. Adding a `cssClass` property on `$event.day` will add that class to the header element
         */
        this.dayHeaderClicked = new EventEmitter();
        /**
         * Called when an event title is clicked
         */
        this.eventClicked = new EventEmitter();
        /**
         * Called when an event is resized or dragged and dropped
         */
        this.eventTimesChanged = new EventEmitter();
        /**
         * An output that will be called before the view is rendered for the current week.
         * If you add the `cssClass` property to a day in the header it will add that class to the cell element in the template
         */
        this.beforeViewRender = new EventEmitter();
        /**
         * Called when an hour segment is clicked
         */
        this.hourSegmentClicked = new EventEmitter();
        /**
         * @hidden
         */
        this.allDayEventResizes = new Map();
        /**
         * @hidden
         */
        this.timeEventResizes = new Map();
        /**
         * @hidden
         */
        this.eventDragEnterByType = {
            allDay: 0,
            time: 0,
        };
        /**
         * @hidden
         */
        this.dragActive = false;
        /**
         * @hidden
         */
        this.dragAlreadyMoved = false;
        /**
         * @hidden
         */
        this.calendarId = Symbol('angular calendar week view id');
        /**
         * @hidden
         */
        this.rtl = false;
        /**
         * @hidden
         */
        this.trackByWeekDayHeaderDate = trackByWeekDayHeaderDate;
        /**
         * @hidden
         */
        this.trackByHourSegment = trackByHourSegment;
        /**
         * @hidden
         */
        this.trackByHour = trackByHour;
        /**
         * @hidden
         */
        this.trackByWeekAllDayEvent = trackByWeekAllDayEvent;
        /**
         * @hidden
         */
        this.trackByWeekTimeEvent = trackByWeekTimeEvent;
        /**
         * @hidden
         */
        this.trackByHourColumn = (index, column) => column.hours[0] ? column.hours[0].segments[0].date.toISOString() : column;
        /**
         * @hidden
         */
        this.trackById = (index, row) => row.id;
        this.locale = locale;
    }
    /**
     * @hidden
     */
    ngOnInit() {
        if (this.refresh) {
            this.refreshSubscription = this.refresh.subscribe(() => {
                this.refreshAll();
                this.cdr.markForCheck();
            });
        }
    }
    /**
     * @hidden
     */
    ngOnChanges(changes) {
        const refreshHeader = changes.viewDate ||
            changes.excludeDays ||
            changes.weekendDays ||
            changes.daysInWeek ||
            changes.weekStartsOn;
        const refreshBody = changes.viewDate ||
            changes.dayStartHour ||
            changes.dayStartMinute ||
            changes.dayEndHour ||
            changes.dayEndMinute ||
            changes.hourSegments ||
            changes.hourDuration ||
            changes.weekStartsOn ||
            changes.weekendDays ||
            changes.excludeDays ||
            changes.hourSegmentHeight ||
            changes.events ||
            changes.daysInWeek ||
            changes.minimumEventHeight;
        if (refreshHeader) {
            this.refreshHeader();
        }
        if (changes.events) {
            validateEvents(this.events);
        }
        if (refreshBody) {
            this.refreshBody();
        }
        if (refreshHeader || refreshBody) {
            this.emitBeforeViewRender();
        }
    }
    /**
     * @hidden
     */
    ngOnDestroy() {
        if (this.refreshSubscription) {
            this.refreshSubscription.unsubscribe();
        }
    }
    /**
     * @hidden
     */
    ngAfterViewInit() {
        this.rtl =
            typeof window !== 'undefined' &&
                getComputedStyle(this.element.nativeElement).direction === 'rtl';
        this.cdr.detectChanges();
    }
    /**
     * @hidden
     */
    timeEventResizeStarted(eventsContainer, timeEvent, resizeEvent) {
        this.timeEventResizes.set(timeEvent.event, resizeEvent);
        this.resizeStarted(eventsContainer, timeEvent);
    }
    /**
     * @hidden
     */
    timeEventResizing(timeEvent, resizeEvent) {
        this.timeEventResizes.set(timeEvent.event, resizeEvent);
        const adjustedEvents = new Map();
        const tempEvents = [...this.events];
        this.timeEventResizes.forEach((lastResizeEvent, event) => {
            const newEventDates = this.getTimeEventResizedDates(event, lastResizeEvent);
            const adjustedEvent = { ...event, ...newEventDates };
            adjustedEvents.set(adjustedEvent, event);
            const eventIndex = tempEvents.indexOf(event);
            tempEvents[eventIndex] = adjustedEvent;
        });
        this.restoreOriginalEvents(tempEvents, adjustedEvents, true);
    }
    /**
     * @hidden
     */
    timeEventResizeEnded(timeEvent) {
        this.view = this.getWeekView(this.events);
        const lastResizeEvent = this.timeEventResizes.get(timeEvent.event);
        if (lastResizeEvent) {
            this.timeEventResizes.delete(timeEvent.event);
            const newEventDates = this.getTimeEventResizedDates(timeEvent.event, lastResizeEvent);
            this.eventTimesChanged.emit({
                newStart: newEventDates.start,
                newEnd: newEventDates.end,
                event: timeEvent.event,
                type: CalendarEventTimesChangedEventType.Resize,
            });
        }
    }
    /**
     * @hidden
     */
    allDayEventResizeStarted(allDayEventsContainer, allDayEvent, resizeEvent) {
        this.allDayEventResizes.set(allDayEvent, {
            originalOffset: allDayEvent.offset,
            originalSpan: allDayEvent.span,
            edge: typeof resizeEvent.edges.left !== 'undefined' ? 'left' : 'right',
        });
        this.resizeStarted(allDayEventsContainer, allDayEvent, this.getDayColumnWidth(allDayEventsContainer));
    }
    /**
     * @hidden
     */
    allDayEventResizing(allDayEvent, resizeEvent, dayWidth) {
        const currentResize = this.allDayEventResizes.get(allDayEvent);
        const modifier = this.rtl ? -1 : 1;
        if (typeof resizeEvent.edges.left !== 'undefined') {
            const diff = Math.round(+resizeEvent.edges.left / dayWidth) * modifier;
            allDayEvent.offset = currentResize.originalOffset + diff;
            allDayEvent.span = currentResize.originalSpan - diff;
        }
        else if (typeof resizeEvent.edges.right !== 'undefined') {
            const diff = Math.round(+resizeEvent.edges.right / dayWidth) * modifier;
            allDayEvent.span = currentResize.originalSpan + diff;
        }
    }
    /**
     * @hidden
     */
    allDayEventResizeEnded(allDayEvent) {
        const currentResize = this.allDayEventResizes.get(allDayEvent);
        if (currentResize) {
            const allDayEventResizingBeforeStart = currentResize.edge === 'left';
            let daysDiff;
            if (allDayEventResizingBeforeStart) {
                daysDiff = allDayEvent.offset - currentResize.originalOffset;
            }
            else {
                daysDiff = allDayEvent.span - currentResize.originalSpan;
            }
            allDayEvent.offset = currentResize.originalOffset;
            allDayEvent.span = currentResize.originalSpan;
            const newDates = this.getAllDayEventResizedDates(allDayEvent.event, daysDiff, allDayEventResizingBeforeStart);
            this.eventTimesChanged.emit({
                newStart: newDates.start,
                newEnd: newDates.end,
                event: allDayEvent.event,
                type: CalendarEventTimesChangedEventType.Resize,
            });
            this.allDayEventResizes.delete(allDayEvent);
        }
    }
    /**
     * @hidden
     */
    getDayColumnWidth(eventRowContainer) {
        return Math.floor(eventRowContainer.offsetWidth / this.days.length);
    }
    /**
     * @hidden
     */
    dateDragEnter(date) {
        this.lastDragEnterDate = date;
    }
    /**
     * @hidden
     */
    eventDropped(dropEvent, date, allDay) {
        if (shouldFireDroppedEvent(dropEvent, date, allDay, this.calendarId) &&
            this.lastDragEnterDate.getTime() === date.getTime() &&
            (!this.snapDraggedEvents ||
                dropEvent.dropData.event !== this.lastDraggedEvent)) {
            this.eventTimesChanged.emit({
                type: CalendarEventTimesChangedEventType.Drop,
                event: dropEvent.dropData.event,
                newStart: date,
                allDay,
            });
        }
        this.lastDraggedEvent = null;
    }
    /**
     * @hidden
     */
    dragEnter(type) {
        this.eventDragEnterByType[type]++;
    }
    /**
     * @hidden
     */
    dragLeave(type) {
        this.eventDragEnterByType[type]--;
    }
    /**
     * @hidden
     */
    dragStarted(eventsContainerElement, eventElement, event, useY) {
        this.dayColumnWidth = this.getDayColumnWidth(eventsContainerElement);
        const dragHelper = new CalendarDragHelper(eventsContainerElement, eventElement);
        this.validateDrag = ({ x, y, transform }) => {
            const isAllowed = this.allDayEventResizes.size === 0 &&
                this.timeEventResizes.size === 0 &&
                dragHelper.validateDrag({
                    x,
                    y,
                    snapDraggedEvents: this.snapDraggedEvents,
                    dragAlreadyMoved: this.dragAlreadyMoved,
                    transform,
                });
            if (isAllowed && this.validateEventTimesChanged) {
                const newEventTimes = this.getDragMovedEventTimes(event, { x, y }, this.dayColumnWidth, useY);
                return this.validateEventTimesChanged({
                    type: CalendarEventTimesChangedEventType.Drag,
                    event: event.event,
                    newStart: newEventTimes.start,
                    newEnd: newEventTimes.end,
                });
            }
            return isAllowed;
        };
        this.dragActive = true;
        this.dragAlreadyMoved = false;
        this.lastDraggedEvent = null;
        this.eventDragEnterByType = {
            allDay: 0,
            time: 0,
        };
        if (!this.snapDraggedEvents && useY) {
            this.view.hourColumns.forEach((column) => {
                const linkedEvent = column.events.find((columnEvent) => columnEvent.event === event.event && columnEvent !== event);
                // hide any linked events while dragging
                if (linkedEvent) {
                    linkedEvent.width = 0;
                    linkedEvent.height = 0;
                }
            });
        }
        this.cdr.markForCheck();
    }
    /**
     * @hidden
     */
    dragMove(dayEvent, dragEvent) {
        const newEventTimes = this.getDragMovedEventTimes(dayEvent, dragEvent, this.dayColumnWidth, true);
        const originalEvent = dayEvent.event;
        const adjustedEvent = { ...originalEvent, ...newEventTimes };
        const tempEvents = this.events.map((event) => {
            if (event === originalEvent) {
                return adjustedEvent;
            }
            return event;
        });
        this.restoreOriginalEvents(tempEvents, new Map([[adjustedEvent, originalEvent]]), this.snapDraggedEvents);
        this.dragAlreadyMoved = true;
    }
    /**
     * @hidden
     */
    allDayEventDragMove() {
        this.dragAlreadyMoved = true;
    }
    /**
     * @hidden
     */
    dragEnded(weekEvent, dragEndEvent, dayWidth, useY = false) {
        this.view = this.getWeekView(this.events);
        this.dragActive = false;
        this.validateDrag = null;
        const { start, end } = this.getDragMovedEventTimes(weekEvent, dragEndEvent, dayWidth, useY);
        if ((this.snapDraggedEvents ||
            this.eventDragEnterByType[useY ? 'time' : 'allDay'] > 0) &&
            isDraggedWithinPeriod(start, end, this.view.period)) {
            this.lastDraggedEvent = weekEvent.event;
            this.eventTimesChanged.emit({
                newStart: start,
                newEnd: end,
                event: weekEvent.event,
                type: CalendarEventTimesChangedEventType.Drag,
                allDay: !useY,
            });
        }
    }
    refreshHeader() {
        this.days = this.utils.getWeekViewHeader({
            viewDate: this.viewDate,
            weekStartsOn: this.weekStartsOn,
            excluded: this.excludeDays,
            weekendDays: this.weekendDays,
            ...getWeekViewPeriod(this.dateAdapter, this.viewDate, this.weekStartsOn, this.excludeDays, this.daysInWeek),
        });
    }
    refreshBody() {
        this.view = this.getWeekView(this.events);
    }
    refreshAll() {
        this.refreshHeader();
        this.refreshBody();
        this.emitBeforeViewRender();
    }
    emitBeforeViewRender() {
        if (this.days && this.view) {
            this.beforeViewRender.emit({
                header: this.days,
                ...this.view,
            });
        }
    }
    getWeekView(events) {
        return this.utils.getWeekView({
            events,
            viewDate: this.viewDate,
            weekStartsOn: this.weekStartsOn,
            excluded: this.excludeDays,
            precision: this.precision,
            absolutePositionedEvents: true,
            hourSegments: this.hourSegments,
            hourDuration: this.hourDuration,
            dayStart: {
                hour: this.dayStartHour,
                minute: this.dayStartMinute,
            },
            dayEnd: {
                hour: this.dayEndHour,
                minute: this.dayEndMinute,
            },
            segmentHeight: this.hourSegmentHeight,
            weekendDays: this.weekendDays,
            minimumEventHeight: this.minimumEventHeight,
            ...getWeekViewPeriod(this.dateAdapter, this.viewDate, this.weekStartsOn, this.excludeDays, this.daysInWeek),
        });
    }
    getDragMovedEventTimes(weekEvent, dragEndEvent, dayWidth, useY) {
        const daysDragged = (roundToNearest(dragEndEvent.x, dayWidth) / dayWidth) *
            (this.rtl ? -1 : 1);
        const minutesMoved = useY
            ? getMinutesMoved(dragEndEvent.y, this.hourSegments, this.hourSegmentHeight, this.eventSnapSize, this.hourDuration)
            : 0;
        const start = this.dateAdapter.addMinutes(addDaysWithExclusions(this.dateAdapter, weekEvent.event.start, daysDragged, this.excludeDays), minutesMoved);
        let end;
        if (weekEvent.event.end) {
            end = this.dateAdapter.addMinutes(addDaysWithExclusions(this.dateAdapter, weekEvent.event.end, daysDragged, this.excludeDays), minutesMoved);
        }
        return { start, end };
    }
    restoreOriginalEvents(tempEvents, adjustedEvents, snapDraggedEvents = true) {
        const previousView = this.view;
        if (snapDraggedEvents) {
            this.view = this.getWeekView(tempEvents);
        }
        const adjustedEventsArray = tempEvents.filter((event) => adjustedEvents.has(event));
        this.view.hourColumns.forEach((column, columnIndex) => {
            previousView.hourColumns[columnIndex].hours.forEach((hour, hourIndex) => {
                hour.segments.forEach((segment, segmentIndex) => {
                    column.hours[hourIndex].segments[segmentIndex].cssClass =
                        segment.cssClass;
                });
            });
            adjustedEventsArray.forEach((adjustedEvent) => {
                const originalEvent = adjustedEvents.get(adjustedEvent);
                const existingColumnEvent = column.events.find((columnEvent) => columnEvent.event ===
                    (snapDraggedEvents ? adjustedEvent : originalEvent));
                if (existingColumnEvent) {
                    // restore the original event so trackBy kicks in and the dom isn't changed
                    existingColumnEvent.event = originalEvent;
                    existingColumnEvent['tempEvent'] = adjustedEvent;
                    if (!snapDraggedEvents) {
                        existingColumnEvent.height = 0;
                        existingColumnEvent.width = 0;
                    }
                }
                else {
                    // add a dummy event to the drop so if the event was removed from the original column the drag doesn't end early
                    const event = {
                        event: originalEvent,
                        left: 0,
                        top: 0,
                        height: 0,
                        width: 0,
                        startsBeforeDay: false,
                        endsAfterDay: false,
                        tempEvent: adjustedEvent,
                    };
                    column.events.push(event);
                }
            });
        });
        adjustedEvents.clear();
    }
    getTimeEventResizedDates(calendarEvent, resizeEvent) {
        const newEventDates = {
            start: calendarEvent.start,
            end: getDefaultEventEnd(this.dateAdapter, calendarEvent, this.minimumEventHeight),
        };
        const { end, ...eventWithoutEnd } = calendarEvent;
        const smallestResizes = {
            start: this.dateAdapter.addMinutes(newEventDates.end, this.minimumEventHeight * -1),
            end: getDefaultEventEnd(this.dateAdapter, eventWithoutEnd, this.minimumEventHeight),
        };
        const modifier = this.rtl ? -1 : 1;
        if (typeof resizeEvent.edges.left !== 'undefined') {
            const daysDiff = Math.round(+resizeEvent.edges.left / this.dayColumnWidth) * modifier;
            const newStart = addDaysWithExclusions(this.dateAdapter, newEventDates.start, daysDiff, this.excludeDays);
            if (newStart < smallestResizes.start) {
                newEventDates.start = newStart;
            }
            else {
                newEventDates.start = smallestResizes.start;
            }
        }
        else if (typeof resizeEvent.edges.right !== 'undefined') {
            const daysDiff = Math.round(+resizeEvent.edges.right / this.dayColumnWidth) * modifier;
            const newEnd = addDaysWithExclusions(this.dateAdapter, newEventDates.end, daysDiff, this.excludeDays);
            if (newEnd > smallestResizes.end) {
                newEventDates.end = newEnd;
            }
            else {
                newEventDates.end = smallestResizes.end;
            }
        }
        if (typeof resizeEvent.edges.top !== 'undefined') {
            const minutesMoved = getMinutesMoved(resizeEvent.edges.top, this.hourSegments, this.hourSegmentHeight, this.eventSnapSize, this.hourDuration);
            const newStart = this.dateAdapter.addMinutes(newEventDates.start, minutesMoved);
            if (newStart < smallestResizes.start) {
                newEventDates.start = newStart;
            }
            else {
                newEventDates.start = smallestResizes.start;
            }
        }
        else if (typeof resizeEvent.edges.bottom !== 'undefined') {
            const minutesMoved = getMinutesMoved(resizeEvent.edges.bottom, this.hourSegments, this.hourSegmentHeight, this.eventSnapSize, this.hourDuration);
            const newEnd = this.dateAdapter.addMinutes(newEventDates.end, minutesMoved);
            if (newEnd > smallestResizes.end) {
                newEventDates.end = newEnd;
            }
            else {
                newEventDates.end = smallestResizes.end;
            }
        }
        return newEventDates;
    }
    resizeStarted(eventsContainer, event, dayWidth) {
        this.dayColumnWidth = this.getDayColumnWidth(eventsContainer);
        const resizeHelper = new CalendarResizeHelper(eventsContainer, dayWidth, this.rtl);
        this.validateResize = ({ rectangle, edges }) => {
            const isWithinBoundary = resizeHelper.validateResize({
                rectangle: { ...rectangle },
                edges,
            });
            if (isWithinBoundary && this.validateEventTimesChanged) {
                let newEventDates;
                if (!dayWidth) {
                    newEventDates = this.getTimeEventResizedDates(event.event, {
                        rectangle,
                        edges,
                    });
                }
                else {
                    const modifier = this.rtl ? -1 : 1;
                    if (typeof edges.left !== 'undefined') {
                        const diff = Math.round(+edges.left / dayWidth) * modifier;
                        newEventDates = this.getAllDayEventResizedDates(event.event, diff, !this.rtl);
                    }
                    else {
                        const diff = Math.round(+edges.right / dayWidth) * modifier;
                        newEventDates = this.getAllDayEventResizedDates(event.event, diff, this.rtl);
                    }
                }
                return this.validateEventTimesChanged({
                    type: CalendarEventTimesChangedEventType.Resize,
                    event: event.event,
                    newStart: newEventDates.start,
                    newEnd: newEventDates.end,
                });
            }
            return isWithinBoundary;
        };
        this.cdr.markForCheck();
    }
    /**
     * @hidden
     */
    getAllDayEventResizedDates(event, daysDiff, beforeStart) {
        let start = event.start;
        let end = event.end || event.start;
        if (beforeStart) {
            start = addDaysWithExclusions(this.dateAdapter, start, daysDiff, this.excludeDays);
        }
        else {
            end = addDaysWithExclusions(this.dateAdapter, end, daysDiff, this.excludeDays);
        }
        return { start, end };
    }
}
CalendarWeekViewComponent.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "15.0.3", ngImport: i0, type: CalendarWeekViewComponent, deps: [{ token: i0.ChangeDetectorRef }, { token: i1.CalendarUtils }, { token: LOCALE_ID }, { token: i2.DateAdapter }, { token: i0.ElementRef }], target: i0.ɵɵFactoryTarget.Component });
CalendarWeekViewComponent.ɵcmp = i0.ɵɵngDeclareComponent({ minVersion: "14.0.0", version: "15.0.3", type: CalendarWeekViewComponent, selector: "mwl-calendar-week-view", inputs: { viewDate: "viewDate", events: "events", excludeDays: "excludeDays", refresh: "refresh", locale: "locale", tooltipPlacement: "tooltipPlacement", tooltipTemplate: "tooltipTemplate", tooltipAppendToBody: "tooltipAppendToBody", tooltipDelay: "tooltipDelay", weekStartsOn: "weekStartsOn", headerTemplate: "headerTemplate", eventTemplate: "eventTemplate", eventTitleTemplate: "eventTitleTemplate", eventActionsTemplate: "eventActionsTemplate", precision: "precision", weekendDays: "weekendDays", snapDraggedEvents: "snapDraggedEvents", hourSegments: "hourSegments", hourDuration: "hourDuration", hourSegmentHeight: "hourSegmentHeight", minimumEventHeight: "minimumEventHeight", dayStartHour: "dayStartHour", dayStartMinute: "dayStartMinute", dayEndHour: "dayEndHour", dayEndMinute: "dayEndMinute", hourSegmentTemplate: "hourSegmentTemplate", eventSnapSize: "eventSnapSize", allDayEventsLabelTemplate: "allDayEventsLabelTemplate", daysInWeek: "daysInWeek", currentTimeMarkerTemplate: "currentTimeMarkerTemplate", validateEventTimesChanged: "validateEventTimesChanged", resizeCursors: "resizeCursors" }, outputs: { dayHeaderClicked: "dayHeaderClicked", eventClicked: "eventClicked", eventTimesChanged: "eventTimesChanged", beforeViewRender: "beforeViewRender", hourSegmentClicked: "hourSegmentClicked" }, usesOnChanges: true, ngImport: i0, template: `
    <div class="cal-week-view" role="grid">
      <mwl-calendar-week-view-header
        [days]="days"
        [locale]="locale"
        [customTemplate]="headerTemplate"
        (dayHeaderClicked)="dayHeaderClicked.emit($event)"
        (eventDropped)="
          eventDropped({ dropData: $event }, $event.newStart, true)
        "
        (dragEnter)="dateDragEnter($event.date)"
      >
      </mwl-calendar-week-view-header>
      <div
        class="cal-all-day-events"
        #allDayEventsContainer
        *ngIf="view.allDayEventRows.length > 0"
        mwlDroppable
        (dragEnter)="dragEnter('allDay')"
        (dragLeave)="dragLeave('allDay')"
      >
        <div class="cal-day-columns">
          <div
            class="cal-time-label-column"
            [ngTemplateOutlet]="allDayEventsLabelTemplate"
          ></div>
          <div
            class="cal-day-column"
            *ngFor="let day of days; trackBy: trackByWeekDayHeaderDate"
            mwlDroppable
            dragOverClass="cal-drag-over"
            (drop)="eventDropped($event, day.date, true)"
            (dragEnter)="dateDragEnter(day.date)"
          ></div>
        </div>
        <div
          *ngFor="let eventRow of view.allDayEventRows; trackBy: trackById"
          #eventRowContainer
          class="cal-events-row"
        >
          <div
            *ngFor="
              let allDayEvent of eventRow.row;
              trackBy: trackByWeekAllDayEvent
            "
            #event
            class="cal-event-container"
            [class.cal-draggable]="
              allDayEvent.event.draggable && allDayEventResizes.size === 0
            "
            [class.cal-starts-within-week]="!allDayEvent.startsBeforeWeek"
            [class.cal-ends-within-week]="!allDayEvent.endsAfterWeek"
            [ngClass]="allDayEvent.event?.cssClass"
            [style.width.%]="(100 / days.length) * allDayEvent.span"
            [style.marginLeft.%]="
              rtl ? null : (100 / days.length) * allDayEvent.offset
            "
            [style.marginRight.%]="
              rtl ? (100 / days.length) * allDayEvent.offset : null
            "
            mwlResizable
            [resizeCursors]="resizeCursors"
            [resizeSnapGrid]="{ left: dayColumnWidth, right: dayColumnWidth }"
            [validateResize]="validateResize"
            (resizeStart)="
              allDayEventResizeStarted(eventRowContainer, allDayEvent, $event)
            "
            (resizing)="
              allDayEventResizing(allDayEvent, $event, dayColumnWidth)
            "
            (resizeEnd)="allDayEventResizeEnded(allDayEvent)"
            mwlDraggable
            dragActiveClass="cal-drag-active"
            [dropData]="{ event: allDayEvent.event, calendarId: calendarId }"
            [dragAxis]="{
              x: allDayEvent.event.draggable && allDayEventResizes.size === 0,
              y:
                !snapDraggedEvents &&
                allDayEvent.event.draggable &&
                allDayEventResizes.size === 0
            }"
            [dragSnapGrid]="snapDraggedEvents ? { x: dayColumnWidth } : {}"
            [validateDrag]="validateDrag"
            [touchStartLongPress]="{ delay: 300, delta: 30 }"
            (dragStart)="
              dragStarted(eventRowContainer, event, allDayEvent, false)
            "
            (dragging)="allDayEventDragMove()"
            (dragEnd)="dragEnded(allDayEvent, $event, dayColumnWidth)"
          >
            <div
              class="cal-resize-handle cal-resize-handle-before-start"
              *ngIf="
                allDayEvent.event?.resizable?.beforeStart &&
                !allDayEvent.startsBeforeWeek
              "
              mwlResizeHandle
              [resizeEdges]="{ left: true }"
            ></div>
            <mwl-calendar-week-view-event
              [locale]="locale"
              [weekEvent]="allDayEvent"
              [tooltipPlacement]="tooltipPlacement"
              [tooltipTemplate]="tooltipTemplate"
              [tooltipAppendToBody]="tooltipAppendToBody"
              [tooltipDelay]="tooltipDelay"
              [customTemplate]="eventTemplate"
              [eventTitleTemplate]="eventTitleTemplate"
              [eventActionsTemplate]="eventActionsTemplate"
              [daysInWeek]="daysInWeek"
              (eventClicked)="
                eventClicked.emit({
                  event: allDayEvent.event,
                  sourceEvent: $event.sourceEvent
                })
              "
            >
            </mwl-calendar-week-view-event>
            <div
              class="cal-resize-handle cal-resize-handle-after-end"
              *ngIf="
                allDayEvent.event?.resizable?.afterEnd &&
                !allDayEvent.endsAfterWeek
              "
              mwlResizeHandle
              [resizeEdges]="{ right: true }"
            ></div>
          </div>
        </div>
      </div>
      <div
        class="cal-time-events"
        mwlDroppable
        (dragEnter)="dragEnter('time')"
        (dragLeave)="dragLeave('time')"
      >
        <div
          class="cal-time-label-column"
          *ngIf="view.hourColumns.length > 0 && daysInWeek !== 1"
        >
          <div
            *ngFor="
              let hour of view.hourColumns[0].hours;
              trackBy: trackByHour;
              let odd = odd
            "
            class="cal-hour"
            [class.cal-hour-odd]="odd"
          >
            <mwl-calendar-week-view-hour-segment
              *ngFor="let segment of hour.segments; trackBy: trackByHourSegment"
              [style.height.px]="hourSegmentHeight"
              [segment]="segment"
              [segmentHeight]="hourSegmentHeight"
              [locale]="locale"
              [customTemplate]="hourSegmentTemplate"
              [isTimeLabel]="true"
              [daysInWeek]="daysInWeek"
            >
            </mwl-calendar-week-view-hour-segment>
          </div>
        </div>
        <div
          class="cal-day-columns"
          [class.cal-resize-active]="timeEventResizes.size > 0"
          #dayColumns
        >
          <div
            class="cal-day-column"
            *ngFor="let column of view.hourColumns; trackBy: trackByHourColumn"
          >
            <mwl-calendar-week-view-current-time-marker
              [columnDate]="column.date"
              [dayStartHour]="dayStartHour"
              [dayStartMinute]="dayStartMinute"
              [dayEndHour]="dayEndHour"
              [dayEndMinute]="dayEndMinute"
              [hourSegments]="hourSegments"
              [hourDuration]="hourDuration"
              [hourSegmentHeight]="hourSegmentHeight"
              [customTemplate]="currentTimeMarkerTemplate"
            ></mwl-calendar-week-view-current-time-marker>
            <div class="cal-events-container">
              <div
                *ngFor="
                  let timeEvent of column.events;
                  trackBy: trackByWeekTimeEvent
                "
                #event
                class="cal-event-container"
                [class.cal-draggable]="
                  timeEvent.event.draggable && timeEventResizes.size === 0
                "
                [class.cal-starts-within-day]="!timeEvent.startsBeforeDay"
                [class.cal-ends-within-day]="!timeEvent.endsAfterDay"
                [ngClass]="timeEvent.event.cssClass"
                [hidden]="timeEvent.height === 0 && timeEvent.width === 0"
                [style.top.px]="timeEvent.top"
                [style.height.px]="timeEvent.height"
                [style.left.%]="timeEvent.left"
                [style.width.%]="timeEvent.width"
                mwlResizable
                [resizeCursors]="resizeCursors"
                [resizeSnapGrid]="{
                  left: dayColumnWidth,
                  right: dayColumnWidth,
                  top: eventSnapSize || hourSegmentHeight,
                  bottom: eventSnapSize || hourSegmentHeight
                }"
                [validateResize]="validateResize"
                [allowNegativeResizes]="true"
                (resizeStart)="
                  timeEventResizeStarted(dayColumns, timeEvent, $event)
                "
                (resizing)="timeEventResizing(timeEvent, $event)"
                (resizeEnd)="timeEventResizeEnded(timeEvent)"
                mwlDraggable
                dragActiveClass="cal-drag-active"
                [dropData]="{ event: timeEvent.event, calendarId: calendarId }"
                [dragAxis]="{
                  x: timeEvent.event.draggable && timeEventResizes.size === 0,
                  y: timeEvent.event.draggable && timeEventResizes.size === 0
                }"
                [dragSnapGrid]="
                  snapDraggedEvents
                    ? {
                        x: dayColumnWidth,
                        y: eventSnapSize || hourSegmentHeight
                      }
                    : {}
                "
                [touchStartLongPress]="{ delay: 300, delta: 30 }"
                [ghostDragEnabled]="!snapDraggedEvents"
                [ghostElementTemplate]="weekEventTemplate"
                [validateDrag]="validateDrag"
                (dragStart)="dragStarted(dayColumns, event, timeEvent, true)"
                (dragging)="dragMove(timeEvent, $event)"
                (dragEnd)="dragEnded(timeEvent, $event, dayColumnWidth, true)"
              >
                <div
                  class="cal-resize-handle cal-resize-handle-before-start"
                  *ngIf="
                    timeEvent.event?.resizable?.beforeStart &&
                    !timeEvent.startsBeforeDay
                  "
                  mwlResizeHandle
                  [resizeEdges]="{
                    left: true,
                    top: true
                  }"
                ></div>
                <ng-template
                  [ngTemplateOutlet]="weekEventTemplate"
                ></ng-template>
                <ng-template #weekEventTemplate>
                  <mwl-calendar-week-view-event
                    [locale]="locale"
                    [weekEvent]="timeEvent"
                    [tooltipPlacement]="tooltipPlacement"
                    [tooltipTemplate]="tooltipTemplate"
                    [tooltipAppendToBody]="tooltipAppendToBody"
                    [tooltipDisabled]="dragActive || timeEventResizes.size > 0"
                    [tooltipDelay]="tooltipDelay"
                    [customTemplate]="eventTemplate"
                    [eventTitleTemplate]="eventTitleTemplate"
                    [eventActionsTemplate]="eventActionsTemplate"
                    [column]="column"
                    [daysInWeek]="daysInWeek"
                    (eventClicked)="
                      eventClicked.emit({
                        event: timeEvent.event,
                        sourceEvent: $event.sourceEvent
                      })
                    "
                  >
                  </mwl-calendar-week-view-event>
                </ng-template>
                <div
                  class="cal-resize-handle cal-resize-handle-after-end"
                  *ngIf="
                    timeEvent.event?.resizable?.afterEnd &&
                    !timeEvent.endsAfterDay
                  "
                  mwlResizeHandle
                  [resizeEdges]="{
                    right: true,
                    bottom: true
                  }"
                ></div>
              </div>
            </div>

            <div
              *ngFor="
                let hour of column.hours;
                trackBy: trackByHour;
                let odd = odd
              "
              class="cal-hour"
              [class.cal-hour-odd]="odd"
            >
              <mwl-calendar-week-view-hour-segment
                *ngFor="
                  let segment of hour.segments;
                  trackBy: trackByHourSegment
                "
                [style.height.px]="hourSegmentHeight"
                [segment]="segment"
                [segmentHeight]="hourSegmentHeight"
                [locale]="locale"
                [customTemplate]="hourSegmentTemplate"
                [daysInWeek]="daysInWeek"
                (mwlClick)="
                  hourSegmentClicked.emit({
                    date: segment.date,
                    sourceEvent: $event
                  })
                "
                [clickListenerDisabled]="
                  hourSegmentClicked.observers.length === 0
                "
                mwlDroppable
                [dragOverClass]="
                  !dragActive || !snapDraggedEvents ? 'cal-drag-over' : null
                "
                dragActiveClass="cal-drag-active"
                (drop)="eventDropped($event, segment.date, false)"
                (dragEnter)="dateDragEnter(segment.date)"
                [isTimeLabel]="daysInWeek === 1"
              >
              </mwl-calendar-week-view-hour-segment>
            </div>
          </div>
        </div>
      </div>
    </div>
  `, isInline: true, dependencies: [{ kind: "directive", type: i3.NgClass, selector: "[ngClass]", inputs: ["class", "ngClass"] }, { kind: "directive", type: i3.NgForOf, selector: "[ngFor][ngForOf]", inputs: ["ngForOf", "ngForTrackBy", "ngForTemplate"] }, { kind: "directive", type: i3.NgIf, selector: "[ngIf]", inputs: ["ngIf", "ngIfThen", "ngIfElse"] }, { kind: "directive", type: i3.NgTemplateOutlet, selector: "[ngTemplateOutlet]", inputs: ["ngTemplateOutletContext", "ngTemplateOutlet", "ngTemplateOutletInjector"] }, { kind: "directive", type: i4.ResizableDirective, selector: "[mwlResizable]", inputs: ["validateResize", "enableGhostResize", "resizeSnapGrid", "resizeCursors", "ghostElementPositioning", "allowNegativeResizes", "mouseMoveThrottleMS"], outputs: ["resizeStart", "resizing", "resizeEnd"], exportAs: ["mwlResizable"] }, { kind: "directive", type: i4.ResizeHandleDirective, selector: "[mwlResizeHandle]", inputs: ["resizeEdges", "resizableContainer"] }, { kind: "directive", type: i5.DraggableDirective, selector: "[mwlDraggable]", inputs: ["dropData", "dragAxis", "dragSnapGrid", "ghostDragEnabled", "showOriginalElementWhileDragging", "validateDrag", "dragCursor", "dragActiveClass", "ghostElementAppendTo", "ghostElementTemplate", "touchStartLongPress", "autoScroll"], outputs: ["dragPointerDown", "dragStart", "ghostElementCreated", "dragging", "dragEnd"] }, { kind: "directive", type: i5.DroppableDirective, selector: "[mwlDroppable]", inputs: ["dragOverClass", "dragActiveClass", "validateDrop"], outputs: ["dragEnter", "dragLeave", "dragOver", "drop"] }, { kind: "directive", type: i6.ClickDirective, selector: "[mwlClick]", inputs: ["clickListenerDisabled"], outputs: ["mwlClick"] }, { kind: "component", type: i7.CalendarWeekViewHeaderComponent, selector: "mwl-calendar-week-view-header", inputs: ["days", "locale", "customTemplate"], outputs: ["dayHeaderClicked", "eventDropped", "dragEnter"] }, { kind: "component", type: i8.CalendarWeekViewEventComponent, selector: "mwl-calendar-week-view-event", inputs: ["locale", "weekEvent", "tooltipPlacement", "tooltipAppendToBody", "tooltipDisabled", "tooltipDelay", "customTemplate", "eventTitleTemplate", "eventActionsTemplate", "tooltipTemplate", "column", "daysInWeek"], outputs: ["eventClicked"] }, { kind: "component", type: i9.CalendarWeekViewHourSegmentComponent, selector: "mwl-calendar-week-view-hour-segment", inputs: ["segment", "segmentHeight", "locale", "isTimeLabel", "daysInWeek", "customTemplate"] }, { kind: "component", type: i10.CalendarWeekViewCurrentTimeMarkerComponent, selector: "mwl-calendar-week-view-current-time-marker", inputs: ["columnDate", "dayStartHour", "dayStartMinute", "dayEndHour", "dayEndMinute", "hourSegments", "hourDuration", "hourSegmentHeight", "customTemplate"] }] });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "15.0.3", ngImport: i0, type: CalendarWeekViewComponent, decorators: [{
            type: Component,
            args: [{
                    selector: 'mwl-calendar-week-view',
                    template: `
    <div class="cal-week-view" role="grid">
      <mwl-calendar-week-view-header
        [days]="days"
        [locale]="locale"
        [customTemplate]="headerTemplate"
        (dayHeaderClicked)="dayHeaderClicked.emit($event)"
        (eventDropped)="
          eventDropped({ dropData: $event }, $event.newStart, true)
        "
        (dragEnter)="dateDragEnter($event.date)"
      >
      </mwl-calendar-week-view-header>
      <div
        class="cal-all-day-events"
        #allDayEventsContainer
        *ngIf="view.allDayEventRows.length > 0"
        mwlDroppable
        (dragEnter)="dragEnter('allDay')"
        (dragLeave)="dragLeave('allDay')"
      >
        <div class="cal-day-columns">
          <div
            class="cal-time-label-column"
            [ngTemplateOutlet]="allDayEventsLabelTemplate"
          ></div>
          <div
            class="cal-day-column"
            *ngFor="let day of days; trackBy: trackByWeekDayHeaderDate"
            mwlDroppable
            dragOverClass="cal-drag-over"
            (drop)="eventDropped($event, day.date, true)"
            (dragEnter)="dateDragEnter(day.date)"
          ></div>
        </div>
        <div
          *ngFor="let eventRow of view.allDayEventRows; trackBy: trackById"
          #eventRowContainer
          class="cal-events-row"
        >
          <div
            *ngFor="
              let allDayEvent of eventRow.row;
              trackBy: trackByWeekAllDayEvent
            "
            #event
            class="cal-event-container"
            [class.cal-draggable]="
              allDayEvent.event.draggable && allDayEventResizes.size === 0
            "
            [class.cal-starts-within-week]="!allDayEvent.startsBeforeWeek"
            [class.cal-ends-within-week]="!allDayEvent.endsAfterWeek"
            [ngClass]="allDayEvent.event?.cssClass"
            [style.width.%]="(100 / days.length) * allDayEvent.span"
            [style.marginLeft.%]="
              rtl ? null : (100 / days.length) * allDayEvent.offset
            "
            [style.marginRight.%]="
              rtl ? (100 / days.length) * allDayEvent.offset : null
            "
            mwlResizable
            [resizeCursors]="resizeCursors"
            [resizeSnapGrid]="{ left: dayColumnWidth, right: dayColumnWidth }"
            [validateResize]="validateResize"
            (resizeStart)="
              allDayEventResizeStarted(eventRowContainer, allDayEvent, $event)
            "
            (resizing)="
              allDayEventResizing(allDayEvent, $event, dayColumnWidth)
            "
            (resizeEnd)="allDayEventResizeEnded(allDayEvent)"
            mwlDraggable
            dragActiveClass="cal-drag-active"
            [dropData]="{ event: allDayEvent.event, calendarId: calendarId }"
            [dragAxis]="{
              x: allDayEvent.event.draggable && allDayEventResizes.size === 0,
              y:
                !snapDraggedEvents &&
                allDayEvent.event.draggable &&
                allDayEventResizes.size === 0
            }"
            [dragSnapGrid]="snapDraggedEvents ? { x: dayColumnWidth } : {}"
            [validateDrag]="validateDrag"
            [touchStartLongPress]="{ delay: 300, delta: 30 }"
            (dragStart)="
              dragStarted(eventRowContainer, event, allDayEvent, false)
            "
            (dragging)="allDayEventDragMove()"
            (dragEnd)="dragEnded(allDayEvent, $event, dayColumnWidth)"
          >
            <div
              class="cal-resize-handle cal-resize-handle-before-start"
              *ngIf="
                allDayEvent.event?.resizable?.beforeStart &&
                !allDayEvent.startsBeforeWeek
              "
              mwlResizeHandle
              [resizeEdges]="{ left: true }"
            ></div>
            <mwl-calendar-week-view-event
              [locale]="locale"
              [weekEvent]="allDayEvent"
              [tooltipPlacement]="tooltipPlacement"
              [tooltipTemplate]="tooltipTemplate"
              [tooltipAppendToBody]="tooltipAppendToBody"
              [tooltipDelay]="tooltipDelay"
              [customTemplate]="eventTemplate"
              [eventTitleTemplate]="eventTitleTemplate"
              [eventActionsTemplate]="eventActionsTemplate"
              [daysInWeek]="daysInWeek"
              (eventClicked)="
                eventClicked.emit({
                  event: allDayEvent.event,
                  sourceEvent: $event.sourceEvent
                })
              "
            >
            </mwl-calendar-week-view-event>
            <div
              class="cal-resize-handle cal-resize-handle-after-end"
              *ngIf="
                allDayEvent.event?.resizable?.afterEnd &&
                !allDayEvent.endsAfterWeek
              "
              mwlResizeHandle
              [resizeEdges]="{ right: true }"
            ></div>
          </div>
        </div>
      </div>
      <div
        class="cal-time-events"
        mwlDroppable
        (dragEnter)="dragEnter('time')"
        (dragLeave)="dragLeave('time')"
      >
        <div
          class="cal-time-label-column"
          *ngIf="view.hourColumns.length > 0 && daysInWeek !== 1"
        >
          <div
            *ngFor="
              let hour of view.hourColumns[0].hours;
              trackBy: trackByHour;
              let odd = odd
            "
            class="cal-hour"
            [class.cal-hour-odd]="odd"
          >
            <mwl-calendar-week-view-hour-segment
              *ngFor="let segment of hour.segments; trackBy: trackByHourSegment"
              [style.height.px]="hourSegmentHeight"
              [segment]="segment"
              [segmentHeight]="hourSegmentHeight"
              [locale]="locale"
              [customTemplate]="hourSegmentTemplate"
              [isTimeLabel]="true"
              [daysInWeek]="daysInWeek"
            >
            </mwl-calendar-week-view-hour-segment>
          </div>
        </div>
        <div
          class="cal-day-columns"
          [class.cal-resize-active]="timeEventResizes.size > 0"
          #dayColumns
        >
          <div
            class="cal-day-column"
            *ngFor="let column of view.hourColumns; trackBy: trackByHourColumn"
          >
            <mwl-calendar-week-view-current-time-marker
              [columnDate]="column.date"
              [dayStartHour]="dayStartHour"
              [dayStartMinute]="dayStartMinute"
              [dayEndHour]="dayEndHour"
              [dayEndMinute]="dayEndMinute"
              [hourSegments]="hourSegments"
              [hourDuration]="hourDuration"
              [hourSegmentHeight]="hourSegmentHeight"
              [customTemplate]="currentTimeMarkerTemplate"
            ></mwl-calendar-week-view-current-time-marker>
            <div class="cal-events-container">
              <div
                *ngFor="
                  let timeEvent of column.events;
                  trackBy: trackByWeekTimeEvent
                "
                #event
                class="cal-event-container"
                [class.cal-draggable]="
                  timeEvent.event.draggable && timeEventResizes.size === 0
                "
                [class.cal-starts-within-day]="!timeEvent.startsBeforeDay"
                [class.cal-ends-within-day]="!timeEvent.endsAfterDay"
                [ngClass]="timeEvent.event.cssClass"
                [hidden]="timeEvent.height === 0 && timeEvent.width === 0"
                [style.top.px]="timeEvent.top"
                [style.height.px]="timeEvent.height"
                [style.left.%]="timeEvent.left"
                [style.width.%]="timeEvent.width"
                mwlResizable
                [resizeCursors]="resizeCursors"
                [resizeSnapGrid]="{
                  left: dayColumnWidth,
                  right: dayColumnWidth,
                  top: eventSnapSize || hourSegmentHeight,
                  bottom: eventSnapSize || hourSegmentHeight
                }"
                [validateResize]="validateResize"
                [allowNegativeResizes]="true"
                (resizeStart)="
                  timeEventResizeStarted(dayColumns, timeEvent, $event)
                "
                (resizing)="timeEventResizing(timeEvent, $event)"
                (resizeEnd)="timeEventResizeEnded(timeEvent)"
                mwlDraggable
                dragActiveClass="cal-drag-active"
                [dropData]="{ event: timeEvent.event, calendarId: calendarId }"
                [dragAxis]="{
                  x: timeEvent.event.draggable && timeEventResizes.size === 0,
                  y: timeEvent.event.draggable && timeEventResizes.size === 0
                }"
                [dragSnapGrid]="
                  snapDraggedEvents
                    ? {
                        x: dayColumnWidth,
                        y: eventSnapSize || hourSegmentHeight
                      }
                    : {}
                "
                [touchStartLongPress]="{ delay: 300, delta: 30 }"
                [ghostDragEnabled]="!snapDraggedEvents"
                [ghostElementTemplate]="weekEventTemplate"
                [validateDrag]="validateDrag"
                (dragStart)="dragStarted(dayColumns, event, timeEvent, true)"
                (dragging)="dragMove(timeEvent, $event)"
                (dragEnd)="dragEnded(timeEvent, $event, dayColumnWidth, true)"
              >
                <div
                  class="cal-resize-handle cal-resize-handle-before-start"
                  *ngIf="
                    timeEvent.event?.resizable?.beforeStart &&
                    !timeEvent.startsBeforeDay
                  "
                  mwlResizeHandle
                  [resizeEdges]="{
                    left: true,
                    top: true
                  }"
                ></div>
                <ng-template
                  [ngTemplateOutlet]="weekEventTemplate"
                ></ng-template>
                <ng-template #weekEventTemplate>
                  <mwl-calendar-week-view-event
                    [locale]="locale"
                    [weekEvent]="timeEvent"
                    [tooltipPlacement]="tooltipPlacement"
                    [tooltipTemplate]="tooltipTemplate"
                    [tooltipAppendToBody]="tooltipAppendToBody"
                    [tooltipDisabled]="dragActive || timeEventResizes.size > 0"
                    [tooltipDelay]="tooltipDelay"
                    [customTemplate]="eventTemplate"
                    [eventTitleTemplate]="eventTitleTemplate"
                    [eventActionsTemplate]="eventActionsTemplate"
                    [column]="column"
                    [daysInWeek]="daysInWeek"
                    (eventClicked)="
                      eventClicked.emit({
                        event: timeEvent.event,
                        sourceEvent: $event.sourceEvent
                      })
                    "
                  >
                  </mwl-calendar-week-view-event>
                </ng-template>
                <div
                  class="cal-resize-handle cal-resize-handle-after-end"
                  *ngIf="
                    timeEvent.event?.resizable?.afterEnd &&
                    !timeEvent.endsAfterDay
                  "
                  mwlResizeHandle
                  [resizeEdges]="{
                    right: true,
                    bottom: true
                  }"
                ></div>
              </div>
            </div>

            <div
              *ngFor="
                let hour of column.hours;
                trackBy: trackByHour;
                let odd = odd
              "
              class="cal-hour"
              [class.cal-hour-odd]="odd"
            >
              <mwl-calendar-week-view-hour-segment
                *ngFor="
                  let segment of hour.segments;
                  trackBy: trackByHourSegment
                "
                [style.height.px]="hourSegmentHeight"
                [segment]="segment"
                [segmentHeight]="hourSegmentHeight"
                [locale]="locale"
                [customTemplate]="hourSegmentTemplate"
                [daysInWeek]="daysInWeek"
                (mwlClick)="
                  hourSegmentClicked.emit({
                    date: segment.date,
                    sourceEvent: $event
                  })
                "
                [clickListenerDisabled]="
                  hourSegmentClicked.observers.length === 0
                "
                mwlDroppable
                [dragOverClass]="
                  !dragActive || !snapDraggedEvents ? 'cal-drag-over' : null
                "
                dragActiveClass="cal-drag-active"
                (drop)="eventDropped($event, segment.date, false)"
                (dragEnter)="dateDragEnter(segment.date)"
                [isTimeLabel]="daysInWeek === 1"
              >
              </mwl-calendar-week-view-hour-segment>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
                }]
        }], ctorParameters: function () { return [{ type: i0.ChangeDetectorRef }, { type: i1.CalendarUtils }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [LOCALE_ID]
                }] }, { type: i2.DateAdapter }, { type: i0.ElementRef }]; }, propDecorators: { viewDate: [{
                type: Input
            }], events: [{
                type: Input
            }], excludeDays: [{
                type: Input
            }], refresh: [{
                type: Input
            }], locale: [{
                type: Input
            }], tooltipPlacement: [{
                type: Input
            }], tooltipTemplate: [{
                type: Input
            }], tooltipAppendToBody: [{
                type: Input
            }], tooltipDelay: [{
                type: Input
            }], weekStartsOn: [{
                type: Input
            }], headerTemplate: [{
                type: Input
            }], eventTemplate: [{
                type: Input
            }], eventTitleTemplate: [{
                type: Input
            }], eventActionsTemplate: [{
                type: Input
            }], precision: [{
                type: Input
            }], weekendDays: [{
                type: Input
            }], snapDraggedEvents: [{
                type: Input
            }], hourSegments: [{
                type: Input
            }], hourDuration: [{
                type: Input
            }], hourSegmentHeight: [{
                type: Input
            }], minimumEventHeight: [{
                type: Input
            }], dayStartHour: [{
                type: Input
            }], dayStartMinute: [{
                type: Input
            }], dayEndHour: [{
                type: Input
            }], dayEndMinute: [{
                type: Input
            }], hourSegmentTemplate: [{
                type: Input
            }], eventSnapSize: [{
                type: Input
            }], allDayEventsLabelTemplate: [{
                type: Input
            }], daysInWeek: [{
                type: Input
            }], currentTimeMarkerTemplate: [{
                type: Input
            }], validateEventTimesChanged: [{
                type: Input
            }], resizeCursors: [{
                type: Input
            }], dayHeaderClicked: [{
                type: Output
            }], eventClicked: [{
                type: Output
            }], eventTimesChanged: [{
                type: Output
            }], beforeViewRender: [{
                type: Output
            }], hourSegmentClicked: [{
                type: Output
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FsZW5kYXItd2Vlay12aWV3LmNvbXBvbmVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3Byb2plY3RzL2FuZ3VsYXItY2FsZW5kYXIvc3JjL21vZHVsZXMvd2Vlay9jYWxlbmRhci13ZWVrLXZpZXcvY2FsZW5kYXItd2Vlay12aWV3LmNvbXBvbmVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQ0wsU0FBUyxFQUNULEtBQUssRUFDTCxNQUFNLEVBQ04sWUFBWSxFQUtaLFNBQVMsRUFDVCxNQUFNLEdBSVAsTUFBTSxlQUFlLENBQUM7QUFnQnZCLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxNQUFNLGlFQUFpRSxDQUFDO0FBQ3JHLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLHFFQUFxRSxDQUFDO0FBQzNHLE9BQU8sRUFFTCxrQ0FBa0MsR0FDbkMsTUFBTSw4RkFBOEYsQ0FBQztBQUV0RyxPQUFPLEVBQ0wsY0FBYyxFQUNkLGNBQWMsRUFDZCx3QkFBd0IsRUFDeEIsa0JBQWtCLEVBQ2xCLFdBQVcsRUFDWCxlQUFlLEVBQ2Ysa0JBQWtCLEVBQ2xCLHFCQUFxQixFQUNyQixxQkFBcUIsRUFDckIsc0JBQXNCLEVBQ3RCLGlCQUFpQixFQUNqQixzQkFBc0IsRUFDdEIsb0JBQW9CLEdBQ3JCLE1BQU0sd0JBQXdCLENBQUM7Ozs7Ozs7Ozs7OztBQW9CaEM7Ozs7Ozs7OztHQVNHO0FBcVZILE1BQU0sT0FBTyx5QkFBeUI7SUFvVXBDOztPQUVHO0lBQ0gsWUFDWSxHQUFzQixFQUN0QixLQUFvQixFQUNYLE1BQWMsRUFDdkIsV0FBd0IsRUFDeEIsT0FBZ0M7UUFKaEMsUUFBRyxHQUFILEdBQUcsQ0FBbUI7UUFDdEIsVUFBSyxHQUFMLEtBQUssQ0FBZTtRQUVwQixnQkFBVyxHQUFYLFdBQVcsQ0FBYTtRQUN4QixZQUFPLEdBQVAsT0FBTyxDQUF5QjtRQXBVNUM7OztXQUdHO1FBQ00sV0FBTSxHQUFv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ImltcG9ydCB7XG4gIENvbXBvbmVudCxcbiAgSW5wdXQsXG4gIE91dHB1dCxcbiAgRXZlbnRFbWl0dGVyLFxuICBDaGFuZ2VEZXRlY3RvclJlZixcbiAgT25DaGFuZ2VzLFxuICBPbkluaXQsXG4gIE9uRGVzdHJveSxcbiAgTE9DQUxFX0lELFxuICBJbmplY3QsXG4gIFRlbXBsYXRlUmVmLFxuICBFbGVtZW50UmVmLFxuICBBZnRlclZpZXdJbml0LFxufSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7IFN1YmplY3QsIFN1YnNjcmlwdGlvbiB9IGZyb20gJ3J4anMnO1xuaW1wb3J0IHtcbiAgV2Vla0RheSxcbiAgQ2FsZW5kYXJFdmVudCxcbiAgV2Vla1ZpZXdBbGxEYXlFdmVudCxcbiAgV2Vla1ZpZXcsXG4gIFZpZXdQZXJpb2QsXG4gIFdlZWtWaWV3SG91ckNvbHVtbixcbiAgV2Vla1ZpZXdUaW1lRXZlbnQsXG4gIFdlZWtWaWV3SG91clNlZ21lbnQsXG4gIFdlZWtWaWV3SG91cixcbiAgV2Vla1ZpZXdBbGxEYXlFdmVudFJvdyxcbn0gZnJvbSAnY2FsZW5kYXItdXRpbHMnO1xuaW1wb3J0IHsgUmVzaXplRXZlbnQgfSBmcm9tICdhbmd1bGFyLXJlc2l6YWJsZS1lbGVtZW50JztcbmltcG9ydCB7IFJlc2l6ZUN1cnNvcnMgfSBmcm9tICdhbmd1bGFyLXJlc2l6YWJsZS1lbGVtZW50JztcbmltcG9ydCB7IENhbGVuZGFyRHJhZ0hlbHBlciB9IGZyb20gJy4uLy4uL2NvbW1vbi9jYWxlbmRhci1kcmFnLWhlbHBlci9jYWxlbmRhci1kcmFnLWhlbHBlci5wcm92aWRlcic7XG5pbXBvcnQgeyBDYWxlbmRhclJlc2l6ZUhlbHBlciB9IGZyb20gJy4uLy4uL2NvbW1vbi9jYWxlbmRhci1yZXNpemUtaGVscGVyL2NhbGVuZGFyLXJlc2l6ZS1oZWxwZXIucHJvdmlkZXInO1xuaW1wb3J0IHtcbiAgQ2FsZW5kYXJFdmVudFRpbWVzQ2hhbmdlZEV2ZW50LFxuICBDYWxlbmRhckV2ZW50VGltZXNDaGFuZ2VkRXZlbnRUeXBlLFxufSBmcm9tICcuLi8uLi9jb21tb24vY2FsZW5kYXItZXZlbnQtdGltZXMtY2hhbmdlZC1ldmVudC9jYWxlbmRhci1ldmVudC10aW1lcy1jaGFuZ2VkLWV2ZW50LmludGVyZmFjZSc7XG5pbXBvcnQgeyBDYWxlbmRhclV0aWxzIH0gZnJvbSAnLi4vLi4vY29tbW9uL2NhbGVuZGFyLXV0aWxzL2NhbGVuZGFyLXV0aWxzLnByb3ZpZGVyJztcbmltcG9ydCB7XG4gIHZhbGlkYXRlRXZlbnRzLFxuICByb3VuZFRvTmVhcmVzdCxcbiAgdHJhY2tCeVdlZWtEYXlIZWFkZXJEYXRlLFxuICB0cmFja0J5SG91clNlZ21lbnQsXG4gIHRyYWNrQnlIb3VyLFxuICBnZXRNaW51dGVzTW92ZWQsXG4gIGdldERlZmF1bHRFdmVudEVuZCxcbiAgYWRkRGF5c1dpdGhFeGNsdXNpb25zLFxuICBpc0RyYWdnZWRXaXRoaW5QZXJpb2QsXG4gIHNob3VsZEZpcmVEcm9wcGVkRXZlbnQsXG4gIGdldFdlZWtWaWV3UGVyaW9kLFxuICB0cmFja0J5V2Vla0FsbERheUV2ZW50LFxuICB0cmFja0J5V2Vla1RpbWVFdmVudCxcbn0gZnJvbSAnLi4vLi4vY29tbW9uL3V0aWwvdXRpbCc7XG5pbXBvcnQgeyBEYXRlQWRhcHRlciB9IGZyb20gJy4uLy4uLy4uL2RhdGUtYWRhcHRlcnMvZGF0ZS1hZGFwdGVyJztcbmltcG9ydCB7XG4gIERyYWdFbmRFdmVudCxcbiAgRHJvcEV2ZW50LFxuICBEcmFnTW92ZUV2ZW50LFxuICBWYWxpZGF0ZURyYWcsXG59IGZyb20gJ2FuZ3VsYXItZHJhZ2dhYmxlLWRyb3BwYWJsZSc7XG5pbXBvcnQgeyBQbGFjZW1lbnRBcnJheSB9IGZyb20gJ3Bvc2l0aW9uaW5nJztcblxuZXhwb3J0IGludGVyZmFjZSBXZWVrVmlld0FsbERheUV2ZW50UmVzaXplIHtcbiAgb3JpZ2luYWxPZmZzZXQ6IG51bWJlcjtcbiAgb3JpZ2luYWxTcGFuOiBudW1iZXI7XG4gIGVkZ2U6IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDYWxlbmRhcldlZWtWaWV3QmVmb3JlUmVuZGVyRXZlbnQgZXh0ZW5kcyBXZWVrVmlldyB7XG4gIGhlYWRlcjogV2Vla0RheVtdO1xufVxuXG4vKipcbiAqIFNob3dzIGFsbCBldmVudHMgb24gYSBnaXZlbiB3ZWVrLiBFeGFtcGxlIHVzYWdlOlxuICpcbiAqIGBgYHR5cGVzY3JpcHRcbiAqIDxtd2wtY2FsZW5kYXItd2Vlay12aWV3XG4gKiAgW3ZpZXdEYXRlXT1cInZpZXdEYXRlXCJcbiAqICBbZXZlbnRzXT1cImV2ZW50c1wiPlxuICogPC9td2wtY2FsZW5kYXItd2Vlay12aWV3PlxuICogYGBgXG4gKi9cbkBDb21wb25lbnQoe1xuICBzZWxlY3RvcjogJ213bC1jYWxlbmRhci13ZWVrLXZpZXcnLFxuICB0ZW1wbGF0ZTogYFxuICAgIDxkaXYgY2xhc3M9XCJjYWwtd2Vlay12aWV3XCIgcm9sZT1cImdyaWRcIj5cbiAgICAgIDxtd2wtY2FsZW5kYXItd2Vlay12aWV3LWhlYWRlclxuICAgICAgICBbZGF5c109XCJkYXlzXCJcbiAgICAgICAgW2xvY2FsZV09XCJsb2NhbGVcIlxuICAgICAgICBbY3VzdG9tVGVtcGxhdGVdPVwiaGVhZGVyVGVtcGxhdGVcIlxuICAgICAgICAoZGF5SGVhZGVyQ2xpY2tlZCk9XCJkYXlIZWFkZXJDbGlja2VkLmVtaXQoJGV2ZW50KVwiXG4gICAgICAgIChldmVudERyb3BwZWQpPVwiXG4gICAgICAgICAgZXZlbnREcm9wcGVkKHsgZHJvcERhdGE6ICRldmVudCB9LCAkZXZlbnQubmV3U3RhcnQsIHRydWUpXG4gICAgICAgIFwiXG4gICAgICAgIChkcmFnRW50ZXIpPVwiZGF0ZURyYWdFbnRlcigkZXZlbnQuZGF0ZSlcIlxuICAgICAgPlxuICAgICAgPC9td2wtY2FsZW5kYXItd2Vlay12aWV3LWhlYWRlcj5cbiAgICAgIDxkaXZcbiAgICAgICAgY2xhc3M9XCJjYWwtYWxsLWRheS1ldmVudHNcIlxuICAgICAgICAjYWxsRGF5RXZlbnRzQ29udGFpbmVyXG4gICAgICAgICpuZ0lmPVwidmlldy5hbGxEYXlFdmVudFJvd3MubGVuZ3RoID4gMFwiXG4gICAgICAgIG13bERyb3BwYWJsZVxuICAgICAgICAoZHJhZ0VudGVyKT1cImRyYWdFbnRlcignYWxsRGF5JylcIlxuICAgICAgICAoZHJhZ0xlYXZlKT1cImRyYWdMZWF2ZSgnYWxsRGF5JylcIlxuICAgICAgPlxuICAgICAgICA8ZGl2IGNsYXNzPVwiY2FsLWRheS1jb2x1bW5zXCI+XG4gICAgICAgICAgPGRpdlxuICAgICAgICAgICAgY2xhc3M9XCJjYWwtdGltZS1sYWJlbC1jb2x1bW5cIlxuICAgICAgICAgICAgW25nVGVtcGxhdGVPdXRsZXRdPVwiYWxsRGF5RXZlbnRzTGFiZWxUZW1wbGF0ZVwiXG4gICAgICAgICAgPjwvZGl2PlxuICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgIGNsYXNzPVwiY2FsLWRheS1jb2x1bW5cIlxuICAgICAgICAgICAgKm5nRm9yPVwibGV0IGRheSBvZiBkYXlzOyB0cmFja0J5OiB0cmFja0J5V2Vla0RheUhlYWRlckRhdGVcIlxuICAgICAgICAgICAgbXdsRHJvcHBhYmxlXG4gICAgICAgICAgICBkcmFnT3ZlckNsYXNzPVwiY2FsLWRyYWctb3ZlclwiXG4gICAgICAgICAgICAoZHJvcCk9XCJldmVudERyb3BwZWQoJGV2ZW50LCBkYXkuZGF0ZSwgdHJ1ZSlcIlxuICAgICAgICAgICAgKGRyYWdFbnRlcik9XCJkYXRlRHJhZ0VudGVyKGRheS5kYXRlKVwiXG4gICAgICAgICAgPjwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdlxuICAgICAgICAgICpuZ0Zvcj1cImxldCBldmVudFJvdyBvZiB2aWV3LmFsbERheUV2ZW50Um93czsgdHJhY2tCeTogdHJhY2tCeUlkXCJcbiAgICAgICAgICAjZXZlbnRSb3dDb250YWluZXJcbiAgICAgICAgICBjbGFzcz1cImNhbC1ldmVudHMtcm93XCJcbiAgICAgICAgPlxuICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICpuZ0Zvcj1cIlxuICAgICAgICAgICAgICBsZXQgYWxsRGF5RXZlbnQgb2YgZXZlbnRSb3cucm93O1xuICAgICAgICAgICAgICB0cmFja0J5OiB0cmFja0J5V2Vla0FsbERheUV2ZW50XG4gICAgICAgICAgICBcIlxuICAgICAgICAgICAgI2V2ZW50XG4gICAgICAgICAgICBjbGFzcz1cImNhbC1ldmVudC1jb250YWluZXJcIlxuICAgICAgICAgICAgW2NsYXNzLmNhbC1kcmFnZ2FibGVdPVwiXG4gICAgICAgICAgICAgIGFsbERheUV2ZW50LmV2ZW50LmRyYWdnYWJsZSAmJiBhbGxEYXlFdmVudFJlc2l6ZXMuc2l6ZSA9PT0gMFxuICAgICAgICAgICAgXCJcbiAgICAgICAgICAgIFtjbGFzcy5jYWwtc3RhcnRzLXdpdGhpbi13ZWVrXT1cIiFhbGxEYXlFdmVudC5zdGFydHNCZWZvcmVXZWVrXCJcbiAgICAgICAgICAgIFtjbGFzcy5jYWwtZW5kcy13aXRoaW4td2Vla109XCIhYWxsRGF5RXZlbnQuZW5kc0FmdGVyV2Vla1wiXG4gICAgICAgICAgICBbbmdDbGFzc109XCJhbGxEYXlFdmVudC5ldmVudD8uY3NzQ2xhc3NcIlxuICAgICAgICAgICAgW3N0eWxlLndpZHRoLiVdPVwiKDEwMCAvIGRheXMubGVuZ3RoKSAqIGFsbERheUV2ZW50LnNwYW5cIlxuICAgICAgICAgICAgW3N0eWxlLm1hcmdpbkxlZnQuJV09XCJcbiAgICAgICAgICAgICAgcnRsID8gbnVsbCA6ICgxMDAgLyBkYXlzLmxlbmd0aCkgKiBhbGxEYXlFdmVudC5vZmZzZXRcbiAgICAgICAgICAgIFwiXG4gICAgICAgICAgICBbc3R5bGUubWFyZ2luUmlnaHQuJV09XCJcbiAgICAgICAgICAgICAgcnRsID8gKDEwMCAvIGRheXMubGVuZ3RoKSAqIGFsbERheUV2ZW50Lm9mZnNldCA6IG51bGxcbiAgICAgICAgICAgIFwiXG4gICAgICAgICAgICBtd2xSZXNpemFibGVcbiAgICAgICAgICAgIFtyZXNpemVDdXJzb3JzXT1cInJlc2l6ZUN1cnNvcnNcIlxuICAgICAgICAgICAgW3Jlc2l6ZVNuYXBHcmlkXT1cInsgbGVmdDogZGF5Q29sdW1uV2lkdGgsIHJpZ2h0OiBkYXlDb2x1bW5XaWR0aCB9XCJcbiAgICAgICAgICAgIFt2YWxpZGF0ZVJlc2l6ZV09XCJ2YWxpZGF0ZVJlc2l6ZVwiXG4gICAgICAgICAgICAocmVzaXplU3RhcnQpPVwiXG4gICAgICAgICAgICAgIGFsbERheUV2ZW50UmVzaXplU3RhcnRlZChldmVudFJvd0NvbnRhaW5lciwgYWxsRGF5RXZlbnQsICRldmVudClcbiAgICAgICAgICAgIFwiXG4gICAgICAgICAgICAocmVzaXppbmcpPVwiXG4gICAgICAgICAgICAgIGFsbERheUV2ZW50UmVzaXppbmcoYWxsRGF5RXZlbnQsICRldmVudCwgZGF5Q29sdW1uV2lkdGgpXG4gICAgICAgICAgICBcIlxuICAgICAgICAgICAgKHJlc2l6ZUVuZCk9XCJhbGxEYXlFdmVudFJlc2l6ZUVuZGVkKGFsbERheUV2ZW50KVwiXG4gICAgICAgICAgICBtd2xEcmFnZ2FibGVcbiAgICAgICAgICAgIGRyYWdBY3RpdmVDbGFzcz1cImNhbC1kcmFnLWFjdGl2ZVwiXG4gICAgICAgICAgICBbZHJvcERhdGFdPVwieyBldmVudDogYWxsRGF5RXZlbnQuZXZlbnQsIGNhbGVuZGFySWQ6IGNhbGVuZGFySWQgfVwiXG4gICAgICAgICAgICBbZHJhZ0F4aXNdPVwie1xuICAgICAgICAgICAgICB4OiBhbGxEYXlFdmVudC5ldmVudC5kcmFnZ2FibGUgJiYgYWxsRGF5RXZlbnRSZXNpemVzLnNpemUgPT09IDAsXG4gICAgICAgICAgICAgIHk6XG4gICAgICAgICAgICAgICAgIXNuYXBEcmFnZ2VkRXZlbnRzICYmXG4gICAgICAgICAgICAgICAgYWxsRGF5RXZlbnQuZXZlbnQuZHJhZ2dhYmxlICYmXG4gICAgICAgICAgICAgICAgYWxsRGF5RXZlbnRSZXNpemVzLnNpemUgPT09IDBcbiAgICAgICAgICAgIH1cIlxuICAgICAgICAgICAgW2RyYWdTbmFwR3JpZF09XCJzbmFwRHJhZ2dlZEV2ZW50cyA/IHsgeDogZGF5Q29sdW1uV2lkdGggfSA6IHt9XCJcbiAgICAgICAgICAgIFt2YWxpZGF0ZURyYWddPVwidmFsaWRhdGVEcmFnXCJcbiAgICAgICAgICAgIFt0b3VjaFN0YXJ0TG9uZ1ByZXNzXT1cInsgZGVsYXk6IDMwMCwgZGVsdGE6IDMwIH1cIlxuICAgICAgICAgICAgKGRyYWdTdGFydCk9XCJcbiAgICAgICAgICAgICAgZHJhZ1N0YXJ0ZWQoZXZlbnRSb3dDb250YWluZXIsIGV2ZW50LCBhbGxEYXlFdmVudCwgZmFsc2UpXG4gICAgICAgICAgICBcIlxuICAgICAgICAgICAgKGRyYWdnaW5nKT1cImFsbERheUV2ZW50RHJhZ01vdmUoKVwiXG4gICAgICAgICAgICAoZHJhZ0VuZCk9XCJkcmFnRW5kZWQoYWxsRGF5RXZlbnQsICRldmVudCwgZGF5Q29sdW1uV2lkdGgpXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgIGNsYXNzPVwiY2FsLXJlc2l6ZS1oYW5kbGUgY2FsLXJlc2l6ZS1oYW5kbGUtYmVmb3JlLXN0YXJ0XCJcbiAgICAgICAgICAgICAgKm5nSWY9XCJcbiAgICAgICAgICAgICAgICBhbGxEYXlFdmVudC5ldmVudD8ucmVzaXphYmxlPy5iZWZvcmVTdGFydCAmJlxuICAgICAgICAgICAgICAgICFhbGxEYXlFdmVudC5zdGFydHNCZWZvcmVXZWVrXG4gICAgICAgICAgICAgIFwiXG4gICAgICAgICAgICAgIG13bFJlc2l6ZUhhbmRsZVxuICAgICAgICAgICAgICBbcmVzaXplRWRnZXNdPVwieyBsZWZ0OiB0cnVlIH1cIlxuICAgICAgICAgICAgPjwvZGl2PlxuICAgICAgICAgICAgPG13bC1jYWxlbmRhci13ZWVrLXZpZXctZXZlbnRcbiAgICAgICAgICAgICAgW2xvY2FsZV09XCJsb2NhbGVcIlxuICAgICAgICAgICAgICBbd2Vla0V2ZW50XT1cImFsbERheUV2ZW50XCJcbiAgICAgICAgICAgICAgW3Rvb2x0aXBQbGFjZW1lbnRdPVwidG9vbHRpcFBsYWNlbWVudFwiXG4gICAgICAgICAgICAgIFt0b29sdGlwVGVtcGxhdGVdPVwidG9vbHRpcFRlbXBsYXRlXCJcbiAgICAgICAgICAgICAgW3Rvb2x0aXBBcHBlbmRUb0JvZHldPVwidG9vbHRpcEFwcGVuZFRvQm9keVwiXG4gICAgICAgICAgICAgIFt0b29sdGlwRGVsYXldPVwidG9vbHRpcERlbGF5XCJcbiAgICAgICAgICAgICAgW2N1c3RvbVRlbXBsYXRlXT1cImV2ZW50VGVtcGxhdGVcIlxuICAgICAgICAgICAgICBbZXZlbnRUaXRsZVRlbXBsYXRlXT1cImV2ZW50VGl0bGVUZW1wbGF0ZVwiXG4gICAgICAgICAgICAgIFtldmVudEFjdGlvbnNUZW1wbGF0ZV09XCJldmVudEFjdGlvbnNUZW1wbGF0ZVwiXG4gICAgICAgICAgICAgIFtkYXlzSW5XZWVrXT1cImRheXNJbldlZWtcIlxuICAgICAgICAgICAgICAoZXZlbnRDbGlja2VkKT1cIlxuICAgICAgICAgICAgICAgIGV2ZW50Q2xpY2tlZC5lbWl0KHtcbiAgICAgICAgICAgICAgICAgIGV2ZW50OiBhbGxEYXlFdmVudC5ldmVudCxcbiAgICAgICAgICAgICAgICAgIHNvdXJjZUV2ZW50OiAkZXZlbnQuc291cmNlRXZlbnRcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICBcIlxuICAgICAgICAgICAgPlxuICAgICAgICAgICAgPC9td2wtY2FsZW5kYXItd2Vlay12aWV3LWV2ZW50PlxuICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICBjbGFzcz1cImNhbC1yZXNpemUtaGFuZGxlIGNhbC1yZXNpemUtaGFuZGxlLWFmdGVyLWVuZFwiXG4gICAgICAgICAgICAgICpuZ0lmPVwiXG4gICAgICAgICAgICAgICAgYWxsRGF5RXZlbnQuZXZlbnQ/LnJlc2l6YWJsZT8uYWZ0ZXJFbmQgJiZcbiAgICAgICAgICAgICAgICAhYWxsRGF5RXZlbnQuZW5kc0FmdGVyV2Vla1xuICAgICAgICAgICAgICBcIlxuICAgICAgICAgICAgICBtd2xSZXNpemVIYW5kbGVcbiAgICAgICAgICAgICAgW3Jlc2l6ZUVkZ2VzXT1cInsgcmlnaHQ6IHRydWUgfVwiXG4gICAgICAgICAgICA+PC9kaXY+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2XG4gICAgICAgIGNsYXNzPVwiY2FsLXRpbWUtZXZlbnRzXCJcbiAgICAgICAgbXdsRHJvcHBhYmxlXG4gICAgICAgIChkcmFnRW50ZXIpPVwiZHJhZ0VudGVyKCd0aW1lJylcIlxuICAgICAgICAoZHJhZ0xlYXZlKT1cImRyYWdMZWF2ZSgndGltZScpXCJcbiAgICAgID5cbiAgICAgICAgPGRpdlxuICAgICAgICAgIGNsYXNzPVwiY2FsLXRpbWUtbGFiZWwtY29sdW1uXCJcbiAgICAgICAgICAqbmdJZj1cInZpZXcuaG91ckNvbHVtbnMubGVuZ3RoID4gMCAmJiBkYXlzSW5XZWVrICE9PSAxXCJcbiAgICAgICAgPlxuICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICpuZ0Zvcj1cIlxuICAgICAgICAgICAgICBsZXQgaG91ciBvZiB2aWV3LmhvdXJDb2x1bW5zWzBdLmhvdXJzO1xuICAgICAgICAgICAgICB0cmFja0J5OiB0cmFja0J5SG91cjtcbiAgICAgICAgICAgICAgbGV0IG9kZCA9IG9kZFxuICAgICAgICAgICAgXCJcbiAgICAgICAgICAgIGNsYXNzPVwiY2FsLWhvdXJcIlxuICAgICAgICAgICAgW2NsYXNzLmNhbC1ob3VyLW9kZF09XCJvZGRcIlxuICAgICAgICAgID5cbiAgICAgICAgICAgIDxtd2wtY2FsZW5kYXItd2Vlay12aWV3LWhvdXItc2VnbWVudFxuICAgICAgICAgICAgICAqbmdGb3I9XCJsZXQgc2VnbWVudCBvZiBob3VyLnNlZ21lbnRzOyB0cmFja0J5OiB0cmFja0J5SG91clNlZ21lbnRcIlxuICAgICAgICAgICAgICBbc3R5bGUuaGVpZ2h0LnB4XT1cImhvdXJTZWdtZW50SGVpZ2h0XCJcbiAgICAgICAgICAgICAgW3NlZ21lbnRdPVwic2VnbWVudFwiXG4gICAgICAgICAgICAgIFtzZWdtZW50SGVpZ2h0XT1cImhvdXJTZWdtZW50SGVpZ2h0XCJcbiAgICAgICAgICAgICAgW2xvY2FsZV09XCJsb2NhbGVcIlxuICAgICAgICAgICAgICBbY3VzdG9tVGVtcGxhdGVdPVwiaG91clNlZ21lbnRUZW1wbGF0ZVwiXG4gICAgICAgICAgICAgIFtpc1RpbWVMYWJlbF09XCJ0cnVlXCJcbiAgICAgICAgICAgICAgW2RheXNJbldlZWtdPVwiZGF5c0luV2Vla1wiXG4gICAgICAgICAgICA+XG4gICAgICAgICAgICA8L213bC1jYWxlbmRhci13ZWVrLXZpZXctaG91ci1zZWdtZW50PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdlxuICAgICAgICAgIGNsYXNzPVwiY2FsLWRheS1jb2x1bW5zXCJcbiAgICAgICAgICBbY2xhc3MuY2FsLXJlc2l6ZS1hY3RpdmVdPVwidGltZUV2ZW50UmVzaXplcy5zaXplID4gMFwiXG4gICAgICAgICAgI2RheUNvbHVtbnNcbiAgICAgICAgPlxuICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgIGNsYXNzPVwiY2FsLWRheS1jb2x1bW5cIlxuICAgICAgICAgICAgKm5nRm9yPVwibGV0IGNvbHVtbiBvZiB2aWV3LmhvdXJDb2x1bW5zOyB0cmFja0J5OiB0cmFja0J5SG91ckNvbHVtblwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAgPG13bC1jYWxlbmRhci13ZWVrLXZpZXctY3VycmVudC10aW1lLW1hcmtlclxuICAgICAgICAgICAgICBbY29sdW1uRGF0ZV09XCJjb2x1bW4uZGF0ZVwiXG4gICAgICAgICAgICAgIFtkYXlTdGFydEhvdXJdPVwiZGF5U3RhcnRIb3VyXCJcbiAgICAgICAgICAgICAgW2RheVN0YXJ0TWludXRlXT1cImRheVN0YXJ0TWludXRlXCJcbiAgICAgICAgICAgICAgW2RheUVuZEhvdXJdPVwiZGF5RW5kSG91clwiXG4gICAgICAgICAgICAgIFtkYXlFbmRNaW51dGVdPVwiZGF5RW5kTWludXRlXCJcbiAgICAgICAgICAgICAgW2hvdXJTZWdtZW50c109XCJob3VyU2VnbWVudHNcIlxuICAgICAgICAgICAgICBbaG91ckR1cmF0aW9uXT1cImhvdXJEdXJhdGlvblwiXG4gICAgICAgICAgICAgIFtob3VyU2VnbWVudEhlaWdodF09XCJob3VyU2VnbWVudEhlaWdodFwiXG4gICAgICAgICAgICAgIFtjdXN0b21UZW1wbGF0ZV09XCJjdXJyZW50VGltZU1hcmtlclRlbXBsYXRlXCJcbiAgICAgICAgICAgID48L213bC1jYWxlbmRhci13ZWVrLXZpZXctY3VycmVudC10aW1lLW1hcmtlcj5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJjYWwtZXZlbnRzLWNvbnRhaW5lclwiPlxuICAgICAgICAgICAgICA8ZGl2XG4gICAgICAgICAgICAgICAgKm5nRm9yPVwiXG4gICAgICAgICAgICAgICAgICBsZXQgdGltZUV2ZW50IG9mIGNvbHVtbi5ldmVudHM7XG4gICAgICAgICAgICAgICAgICB0cmFja0J5OiB0cmFja0J5V2Vla1RpbWVFdmVudFxuICAgICAgICAgICAgICAgIFwiXG4gICAgICAgICAgICAgICAgI2V2ZW50XG4gICAgICAgICAgICAgICAgY2xhc3M9XCJjYWwtZXZlbnQtY29udGFpbmVyXCJcbiAgICAgICAgICAgICAgICBbY2xhc3MuY2FsLWRyYWdnYWJsZV09XCJcbiAgICAgICAgICAgICAgICAgIHRpbWVFdmVudC5ldmVudC5kcmFnZ2FibGUgJiYgdGltZUV2ZW50UmVzaXplcy5zaXplID09PSAwXG4gICAgICAgICAgICAgICAgXCJcbiAgICAgICAgICAgICAgICBbY2xhc3MuY2FsLXN0YXJ0cy13aXRoaW4tZGF5XT1cIiF0aW1lRXZlbnQuc3RhcnRzQmVmb3JlRGF5XCJcbiAgICAgICAgICAgICAgICBbY2xhc3MuY2FsLWVuZHMtd2l0aGluLWRheV09XCIhdGltZUV2ZW50LmVuZHNBZnRlckRheVwiXG4gICAgICAgICAgICAgICAgW25nQ2xhc3NdPVwidGltZUV2ZW50LmV2ZW50LmNzc0NsYXNzXCJcbiAgICAgICAgICAgICAgICBbaGlkZGVuXT1cInRpbWVFdmVudC5oZWlnaHQgPT09IDAgJiYgdGltZUV2ZW50LndpZHRoID09PSAwXCJcbiAgICAgICAgICAgICAgICBbc3R5bGUudG9wLnB4XT1cInRpbWVFdmVudC50b3BcIlxuICAgICAgICAgICAgICAgIFtzdHlsZS5oZWlnaHQucHhdPVwidGltZUV2ZW50LmhlaWdodFwiXG4gICAgICAgICAgICAgICAgW3N0eWxlLmxlZnQuJV09XCJ0aW1lRXZlbnQubGVmdFwiXG4gICAgICAgICAgICAgICAgW3N0eWxlLndpZHRoLiVdPVwidGltZUV2ZW50LndpZHRoXCJcbiAgICAgICAgICAgICAgICBtd2xSZXNpemFibGVcbiAgICAgICAgICAgICAgICBbcmVzaXplQ3Vyc29yc109XCJyZXNpemVDdXJzb3JzXCJcbiAgICAgICAgICAgICAgICBbcmVzaXplU25hcEdyaWRdPVwie1xuICAgICAgICAgICAgICAgICAgbGVmdDogZGF5Q29sdW1uV2lkdGgsXG4gICAgICAgICAgICAgICAgICByaWdodDogZGF5Q29sdW1uV2lkdGgsXG4gICAgICAgICAgICAgICAgICB0b3A6IGV2ZW50U25hcFNpemUgfHwgaG91clNlZ21lbnRIZWlnaHQsXG4gICAgICAgICAgICAgICAgICBib3R0b206IGV2ZW50U25hcFNpemUgfHwgaG91clNlZ21lbnRIZWlnaHRcbiAgICAgICAgICAgICAgICB9XCJcbiAgICAgICAgICAgICAgICBbdmFsaWRhdGVSZXNpemVdPVwidmFsaWRhdGVSZXNpemVcIlxuICAgICAgICAgICAgICAgIFthbGxvd05lZ2F0aXZlUmVzaXplc109XCJ0cnVlXCJcbiAgICAgICAgICAgICAgICAocmVzaXplU3RhcnQpPVwiXG4gICAgICAgICAgICAgICAgICB0aW1lRXZlbnRSZXNpemVTdGFydGVkKGRheUNvbHVtbnMsIHRpbWVFdmVudCwgJGV2ZW50KVxuICAgICAgICAgICAgICAgIFwiXG4gICAgICAgICAgICAgICAgKHJlc2l6aW5nKT1cInRpbWVFdmVudFJlc2l6aW5nKHRpbWVFdmVudCwgJGV2ZW50KVwiXG4gICAgICAgICAgICAgICAgKHJlc2l6ZUVuZCk9XCJ0aW1lRXZlbnRSZXNpemVFbmRlZCh0aW1lRXZlbnQpXCJcbiAgICAgICAgICAgICAgICBtd2xEcmFnZ2FibGVcbiAgICAgICAgICAgICAgICBkcmFnQWN0aXZlQ2xhc3M9XCJjYWwtZHJhZy1hY3RpdmVcIlxuICAgICAgICAgICAgICAgIFtkcm9wRGF0YV09XCJ7IGV2ZW50OiB0aW1lRXZlbnQuZXZlbnQsIGNhbGVuZGFySWQ6IGNhbGVuZGFySWQgfVwiXG4gICAgICAgICAgICAgICAgW2RyYWdBeGlzXT1cIntcbiAgICAgICAgICAgICAgICAgIHg6IHRpbWVFdmVudC5ldmVudC5kcmFnZ2FibGUgJiYgdGltZUV2ZW50UmVzaXplcy5zaXplID09PSAwLFxuICAgICAgICAgICAgICAgICAgeTogdGltZUV2ZW50LmV2ZW50LmRyYWdnYWJsZSAmJiB0aW1lRXZlbnRSZXNpemVzLnNpemUgPT09IDBcbiAgICAgICAgICAgICAgICB9XCJcbiAgICAgICAgICAgICAgICBbZHJhZ1NuYXBHcmlkXT1cIlxuICAgICAgICAgICAgICAgICAgc25hcERyYWdnZWRFdmVudHNcbiAgICAgICAgICAgICAgICAgICAgPyB7XG4gICAgICAgICAgICAgICAgICAgICAgICB4OiBkYXlDb2x1bW5XaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHk6IGV2ZW50U25hcFNpemUgfHwgaG91clNlZ21lbnRIZWlnaHRcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIDoge31cbiAgICAgICAgICAgICAgICBcIlxuICAgICAgICAgICAgICAgIFt0b3VjaFN0YXJ0TG9uZ1ByZXNzXT1cInsgZGVsYXk6IDMwMCwgZGVsdGE6IDMwIH1cIlxuICAgICAgICAgICAgICAgIFtnaG9zdERyYWdFbmFibGVkXT1cIiFzbmFwRHJhZ2dlZEV2ZW50c1wiXG4gICAgICAgICAgICAgICAgW2dob3N0RWxlbWVudFRlbXBsYXRlXT1cIndlZWtFdmVudFRlbXBsYXRlXCJcbiAgICAgICAgICAgICAgICBbdmFsaWRhdGVEcmFnXT1cInZhbGlkYXRlRHJhZ1wiXG4gICAgICAgICAgICAgICAgKGRyYWdTdGFydCk9XCJkcmFnU3RhcnRlZChkYXlDb2x1bW5zLCBldmVudCwgdGltZUV2ZW50LCB0cnVlKVwiXG4gICAgICAgICAgICAgICAgKGRyYWdnaW5nKT1cImRyYWdNb3ZlKHRpbWVFdmVudCwgJGV2ZW50KVwiXG4gICAgICAgICAgICAgICAgKGRyYWdFbmQpPVwiZHJhZ0VuZGVkKHRpbWVFdmVudCwgJGV2ZW50LCBkYXlDb2x1bW5XaWR0aCwgdHJ1ZSlcIlxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgY2xhc3M9XCJjYWwtcmVzaXplLWhhbmRsZSBjYWwtcmVzaXplLWhhbmRsZS1iZWZvcmUtc3RhcnRcIlxuICAgICAgICAgICAgICAgICAgKm5nSWY9XCJcbiAgICAgICAgICAgICAgICAgICAgdGltZUV2ZW50LmV2ZW50Py5yZXNpemFibGU/LmJlZm9yZVN0YXJ0ICYmXG4gICAgICAgICAgICAgICAgICAgICF0aW1lRXZlbnQuc3RhcnRzQmVmb3JlRGF5XG4gICAgICAgICAgICAgICAgICBcIlxuICAgICAgICAgICAgICAgICAgbXdsUmVzaXplSGFuZGxlXG4gICAgICAgICAgICAgICAgICBbcmVzaXplRWRnZXNdPVwie1xuICAgICAgICAgICAgICAgICAgICBsZWZ0OiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB0b3A6IHRydWVcbiAgICAgICAgICAgICAgICAgIH1cIlxuICAgICAgICAgICAgICAgID48L2Rpdj5cbiAgICAgICAgICAgICAgICA8bmctdGVtcGxhdGVcbiAgICAgICAgICAgICAgICAgIFtuZ1RlbXBsYXRlT3V0bGV0XT1cIndlZWtFdmVudFRlbXBsYXRlXCJcbiAgICAgICAgICAgICAgICA+PC9uZy10ZW1wbGF0ZT5cbiAgICAgICAgICAgICAgICA8bmctdGVtcGxhdGUgI3dlZWtFdmVudFRlbXBsYXRlPlxuICAgICAgICAgICAgICAgICAgPG13bC1jYWxlbmRhci13ZWVrLXZpZXctZXZlbnRcbiAgICAgICAgICAgICAgICAgICAgW2xvY2FsZV09XCJsb2NhbGVcIlxuICAgICAgICAgICAgICAgICAgICBbd2Vla0V2ZW50XT1cInRpbWVFdmVudFwiXG4gICAgICAgICAgICAgICAgICAgIFt0b29sdGlwUGxhY2VtZW50XT1cInRvb2x0aXBQbGFjZW1lbnRcIlxuICAgICAgICAgICAgICAgICAgICBbdG9vbHRpcFRlbXBsYXRlXT1cInRvb2x0aXBUZW1wbGF0ZVwiXG4gICAgICAgICAgICAgICAgICAgIFt0b29sdGlwQXBwZW5kVG9Cb2R5XT1cInRvb2x0aXBBcHBlbmRUb0JvZHlcIlxuICAgICAgICAgICAgICAgICAgICBbdG9vbHRpcERpc2FibGVkXT1cImRyYWdBY3RpdmUgfHwgdGltZUV2ZW50UmVzaXplcy5zaXplID4gMFwiXG4gICAgICAgICAgICAgICAgICAgIFt0b29sdGlwRGVsYXldPVwidG9vbHRpcERlbGF5XCJcbiAgICAgICAgICAgICAgICAgICAgW2N1c3RvbVRlbXBsYXRlXT1cImV2ZW50VGVtcGxhdGVcIlxuICAgICAgICAgICAgICAgICAgICBbZXZlbnRUaXRsZVRlbXBsYXRlXT1cImV2ZW50VGl0bGVUZW1wbGF0ZVwiXG4gICAgICAgICAgICAgICAgICAgIFtldmVudEFjdGlvbnNUZW1wbGF0ZV09XCJldmVudEFjdGlvbnNUZW1wbGF0ZVwiXG4gICAgICAgICAgICAgICAgICAgIFtjb2x1bW5dPVwiY29sdW1uXCJcbiAgICAgICAgICAgICAgICAgICAgW2RheXNJbldlZWtdPVwiZGF5c0luV2Vla1wiXG4gICAgICAgICAgICAgICAgICAgIChldmVudENsaWNrZWQpPVwiXG4gICAgICAgICAgICAgICAgICAgICAgZXZlbnRDbGlja2VkLmVtaXQoe1xuICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQ6IHRpbWVFdmVudC5ldmVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNvdXJjZUV2ZW50OiAkZXZlbnQuc291cmNlRXZlbnRcbiAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICBcIlxuICAgICAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgICAgPC9td2wtY2FsZW5kYXItd2Vlay12aWV3LWV2ZW50PlxuICAgICAgICAgICAgICAgIDwvbmctdGVtcGxhdGU+XG4gICAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgICAgY2xhc3M9XCJjYWwtcmVzaXplLWhhbmRsZSBjYWwtcmVzaXplLWhhbmRsZS1hZnRlci1lbmRcIlxuICAgICAgICAgICAgICAgICAgKm5nSWY9XCJcbiAgICAgICAgICAgICAgICAgICAgdGltZUV2ZW50LmV2ZW50Py5yZXNpemFibGU/LmFmdGVyRW5kICYmXG4gICAgICAgICAgICAgICAgICAgICF0aW1lRXZlbnQuZW5kc0FmdGVyRGF5XG4gICAgICAgICAgICAgICAgICBcIlxuICAgICAgICAgICAgICAgICAgbXdsUmVzaXplSGFuZGxlXG4gICAgICAgICAgICAgICAgICBbcmVzaXplRWRnZXNdPVwie1xuICAgICAgICAgICAgICAgICAgICByaWdodDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgYm90dG9tOiB0cnVlXG4gICAgICAgICAgICAgICAgICB9XCJcbiAgICAgICAgICAgICAgICA+PC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+XG5cbiAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgKm5nRm9yPVwiXG4gICAgICAgICAgICAgICAgbGV0IGhvdXIgb2YgY29sdW1uLmhvdXJzO1xuICAgICAgICAgICAgICAgIHRyYWNrQnk6IHRyYWNrQnlIb3VyO1xuICAgICAgICAgICAgICAgIGxldCBvZGQgPSBvZGRcbiAgICAgICAgICAgICAgXCJcbiAgICAgICAgICAgICAgY2xhc3M9XCJjYWwtaG91clwiXG4gICAgICAgICAgICAgIFtjbGFzcy5jYWwtaG91ci1vZGRdPVwib2RkXCJcbiAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgPG13bC1jYWxlbmRhci13ZWVrLXZpZXctaG91ci1zZWdtZW50XG4gICAgICAgICAgICAgICAgKm5nRm9yPVwiXG4gICAgICAgICAgICAgICAgICBsZXQgc2VnbWVudCBvZiBob3VyLnNlZ21lbnRzO1xuICAgICAgICAgICAgICAgICAgdHJhY2tCeTogdHJhY2tCeUhvdXJTZWdtZW50XG4gICAgICAgICAgICAgICAgXCJcbiAgICAgICAgICAgICAgICBbc3R5bGUuaGVpZ2h0LnB4XT1cImhvdXJTZWdtZW50SGVpZ2h0XCJcbiAgICAgICAgICAgICAgICBbc2VnbWVudF09XCJzZWdtZW50XCJcbiAgICAgICAgICAgICAgICBbc2VnbWVudEhlaWdodF09XCJob3VyU2VnbWVudEhlaWdodFwiXG4gICAgICAgICAgICAgICAgW2xvY2FsZV09XCJsb2NhbGVcIlxuICAgICAgICAgICAgICAgIFtjdXN0b21UZW1wbGF0ZV09XCJob3VyU2VnbWVudFRlbXBsYXRlXCJcbiAgICAgICAgICAgICAgICBbZGF5c0luV2Vla109XCJkYXlzSW5XZWVrXCJcbiAgICAgICAgICAgICAgICAobXdsQ2xpY2spPVwiXG4gICAgICAgICAgICAgICAgICBob3VyU2VnbWVudENsaWNrZWQuZW1pdCh7XG4gICAgICAgICAgICAgICAgICAgIGRhdGU6IHNlZ21lbnQuZGF0ZSxcbiAgICAgICAgICAgICAgICAgICAgc291cmNlRXZlbnQ6ICRldmVudFxuICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICBcIlxuICAgICAgICAgICAgICAgIFtjbGlja0xpc3RlbmVyRGlzYWJsZWRdPVwiXG4gICAgICAgICAgICAgICAgICBob3VyU2VnbWVudENsaWNrZWQub2JzZXJ2ZXJzLmxlbmd0aCA9PT0gMFxuICAgICAgICAgICAgICAgIFwiXG4gICAgICAgICAgICAgICAgbXdsRHJvcHBhYmxlXG4gICAgICAgICAgICAgICAgW2RyYWdPdmVyQ2xhc3NdPVwiXG4gICAgICAgICAgICAgICAgICAhZHJhZ0FjdGl2ZSB8fCAhc25hcERyYWdnZWRFdmVudHMgPyAnY2FsLWRyYWctb3ZlcicgOiBudWxsXG4gICAgICAgICAgICAgICAgXCJcbiAgICAgICAgICAgICAgICBkcmFnQWN0aXZlQ2xhc3M9XCJjYWwtZHJhZy1hY3RpdmVcIlxuICAgICAgICAgICAgICAgIChkcm9wKT1cImV2ZW50RHJvcHBlZCgkZXZlbnQsIHNlZ21lbnQuZGF0ZSwgZmFsc2UpXCJcbiAgICAgICAgICAgICAgICAoZHJhZ0VudGVyKT1cImRhdGVEcmFnRW50ZXIoc2VnbWVudC5kYXRlKVwiXG4gICAgICAgICAgICAgICAgW2lzVGltZUxhYmVsXT1cImRheXNJbldlZWsgPT09IDFcIlxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgIDwvbXdsLWNhbGVuZGFyLXdlZWstdmlldy1ob3VyLXNlZ21lbnQ+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgYCxcbn0pXG5leHBvcnQgY2xhc3MgQ2FsZW5kYXJXZWVrVmlld0NvbXBvbmVudFxuICBpbXBsZW1lbnRzIE9uQ2hhbmdlcywgT25Jbml0LCBPbkRlc3Ryb3ksIEFmdGVyVmlld0luaXRcbntcbiAgLyoqXG4gICAqIFRoZSBjdXJyZW50IHZpZXcgZGF0ZVxuICAgKi9cbiAgQElucHV0KCkgdmlld0RhdGU6IERhdGU7XG5cbiAgLyoqXG4gICAqIEFuIGFycmF5IG9mIGV2ZW50cyB0byBkaXNwbGF5IG9uIHZpZXdcbiAgICogVGhlIHNjaGVtYSBpcyBhdmFpbGFibGUgaGVyZTogaHR0cHM6Ly9naXRodWIuY29tL21hdHRsZXdpczkyL2NhbGVuZGFyLXV0aWxzL2Jsb2IvYzUxNjg5OTg1ZjU5YTI3MTk0MGUzMGJjNGUyYzRlMWZlZTNmY2I1Yy9zcmMvY2FsZW5kYXJVdGlscy50cyNMNDktTDYzXG4gICAqL1xuICBASW5wdXQoKSBldmVudHM6IENhbGVuZGFyRXZlbnRbXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBBbiBhcnJheSBvZiBkYXkgaW5kZXhlcyAoMCA9IHN1bmRheSwgMSA9IG1vbmRheSBldGMpIHRoYXQgd2lsbCBiZSBoaWRkZW4gb24gdGhlIHZpZXdcbiAgICovXG4gIEBJbnB1dCgpIGV4Y2x1ZGVEYXlzOiBudW1iZXJbXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBBbiBvYnNlcnZhYmxlIHRoYXQgd2hlbiBlbWl0dGVkIG9uIHdpbGwgcmUtcmVuZGVyIHRoZSBjdXJyZW50IHZpZXdcbiAgICovXG4gIEBJbnB1dCgpIHJlZnJlc2g6IFN1YmplY3Q8YW55PjtcblxuICAvKipcbiAgICogVGhlIGxvY2FsZSB1c2VkIHRvIGZvcm1hdCBkYXRlc1xuICAgKi9cbiAgQElucHV0KCkgbG9jYWxlOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFRoZSBwbGFjZW1lbnQgb2YgdGhlIGV2ZW50IHRvb2x0aXBcbiAgICovXG4gIEBJbnB1dCgpIHRvb2x0aXBQbGFjZW1lbnQ6IFBsYWNlbWVudEFycmF5ID0gJ2F1dG8nO1xuXG4gIC8qKlxuICAgKiBBIGN1c3RvbSB0ZW1wbGF0ZSB0byB1c2UgZm9yIHRoZSBldmVudCB0b29sdGlwc1xuICAgKi9cbiAgQElucHV0KCkgdG9vbHRpcFRlbXBsYXRlOiBUZW1wbGF0ZVJlZjxhbnk+O1xuXG4gIC8qKlxuICAgKiBXaGV0aGVyIHRvIGFwcGVuZCB0b29sdGlwcyB0byB0aGUgYm9keSBvciBuZXh0IHRvIHRoZSB0cmlnZ2VyIGVsZW1lbnRcbiAgICovXG4gIEBJbnB1dCgpIHRvb2x0aXBBcHBlbmRUb0JvZHk6IGJvb2xlYW4gPSB0cnVlO1xuXG4gIC8qKlxuICAgKiBUaGUgZGVsYXkgaW4gbWlsbGlzZWNvbmRzIGJlZm9yZSB0aGUgdG9vbHRpcCBzaG91bGQgYmUgZGlzcGxheWVkLiBJZiBub3QgcHJvdmlkZWQgdGhlIHRvb2x0aXBcbiAgICogd2lsbCBiZSBkaXNwbGF5ZWQgaW1tZWRpYXRlbHkuXG4gICAqL1xuICBASW5wdXQoKSB0b29sdGlwRGVsYXk6IG51bWJlciB8IG51bGwgPSBudWxsO1xuXG4gIC8qKlxuICAgKiBUaGUgc3RhcnQgbnVtYmVyIG9mIHRoZSB3ZWVrLlxuICAgKiBUaGlzIGlzIGlnbm9yZWQgd2hlbiB0aGUgYGRheXNJbldlZWtgIGlucHV0IGlzIGFsc28gc2V0IGFzIHRoZSBgdmlld0RhdGVgIHdpbGwgYmUgdXNlZCBhcyB0aGUgc3RhcnQgb2YgdGhlIHdlZWsgaW5zdGVhZC5cbiAgICogTm90ZSwgeW91IHNob3VsZCBhbHNvIHBhc3MgdGhpcyB0byB0aGUgY2FsZW5kYXIgdGl0bGUgcGlwZSBzbyBpdCBzaG93cyB0aGUgc2FtZSBkYXlzOiB7eyB2aWV3RGF0ZSB8IGNhbGVuZGFyRGF0ZToodmlldyArICdWaWV3VGl0bGUnKTpsb2NhbGU6d2Vla1N0YXJ0c09uIH19XG4gICAqIElmIHVzaW5nIHRoZSBtb21lbnQgZGF0ZSBhZGFwdGVyIHRoaXMgb3B0aW9uIHdvbid0IGRvIGFueXRoaW5nIGFuZCB5b3UnbGwgbmVlZCB0byBzZXQgaXQgZ2xvYmFsbHkgbGlrZSBzbzpcbiAgICogYGBgXG4gICAqIG1vbWVudC51cGRhdGVMb2NhbGUoJ2VuJywge1xuICAgKiAgIHdlZWs6IHtcbiAgICogICAgIGRvdzogMSwgLy8gc2V0IHN0YXJ0IG9mIHdlZWsgdG8gbW9uZGF5IGluc3RlYWRcbiAgICogICAgIGRveTogMCxcbiAgICogICB9LFxuICAgKiB9KTtcbiAgICogYGBgXG4gICAqL1xuICBASW5wdXQoKSB3ZWVrU3RhcnRzT246IG51bWJlcjtcblxuICAvKipcbiAgICogQSBjdXN0b20gdGVtcGxhdGUgdG8gdXNlIHRvIHJlcGxhY2UgdGhlIGhlYWRlclxuICAgKi9cbiAgQElucHV0KCkgaGVhZGVyVGVtcGxhdGU6IFRlbXBsYXRlUmVmPGFueT47XG5cbiAgLyoqXG4gICAqIEEgY3VzdG9tIHRlbXBsYXRlIHRvIHVzZSBmb3Igd2VlayB2aWV3IGV2ZW50c1xuICAgKi9cbiAgQElucHV0KCkgZXZlbnRUZW1wbGF0ZTogVGVtcGxhdGVSZWY8YW55PjtcblxuICAvKipcbiAgICogQSBjdXN0b20gdGVtcGxhdGUgdG8gdXNlIGZvciBldmVudCB0aXRsZXNcbiAgICovXG4gIEBJbnB1dCgpIGV2ZW50VGl0bGVUZW1wbGF0ZTogVGVtcGxhdGVSZWY8YW55PjtcblxuICAvKipcbiAgICogQSBjdXN0b20gdGVtcGxhdGUgdG8gdXNlIGZvciBldmVudCBhY3Rpb25zXG4gICAqL1xuICBASW5wdXQoKSBldmVudEFjdGlvbnNUZW1wbGF0ZTogVGVtcGxhdGVSZWY8YW55PjtcblxuICAvKipcbiAgICogVGhlIHByZWNpc2lvbiB0byBkaXNwbGF5IGV2ZW50cy5cbiAgICogYGRheXNgIHdpbGwgcm91bmQgZXZlbnQgc3RhcnQgYW5kIGVuZCBkYXRlcyB0byB0aGUgbmVhcmVzdCBkYXkgYW5kIGBtaW51dGVzYCB3aWxsIG5vdCBkbyB0aGlzIHJvdW5kaW5nXG4gICAqL1xuICBASW5wdXQoKSBwcmVjaXNpb246ICdkYXlzJyB8ICdtaW51dGVzJyA9ICdkYXlzJztcblxuICAvKipcbiAgICogQW4gYXJyYXkgb2YgZGF5IGluZGV4ZXMgKDAgPSBzdW5kYXksIDEgPSBtb25kYXkgZXRjKSB0aGF0IGluZGljYXRlIHdoaWNoIGRheXMgYXJlIHdlZWtlbmRzXG4gICAqL1xuICBASW5wdXQoKSB3ZWVrZW5kRGF5czogbnVtYmVyW107XG5cbiAgLyoqXG4gICAqIFdoZXRoZXIgdG8gc25hcCBldmVudHMgdG8gYSBncmlkIHdoZW4gZHJhZ2dpbmdcbiAgICovXG4gIEBJbnB1dCgpIHNuYXBEcmFnZ2VkRXZlbnRzOiBib29sZWFuID0gdHJ1ZTtcblxuICAvKipcbiAgICogVGhlIG51bWJlciBvZiBzZWdtZW50cyBpbiBhbiBob3VyLiBNdXN0IGRpdmlkZSBlcXVhbGx5IGludG8gNjAuXG4gICAqL1xuICBASW5wdXQoKSBob3VyU2VnbWVudHM6IG51bWJlciA9IDI7XG5cbiAgLyoqXG4gICAqIFRoZSBkdXJhdGlvbiBvZiBlYWNoIHNlZ21lbnQgZ3JvdXAgaW4gbWludXRlc1xuICAgKi9cbiAgQElucHV0KCkgaG91ckR1cmF0aW9uOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBoZWlnaHQgaW4gcGl4ZWxzIG9mIGVhY2ggaG91ciBzZWdtZW50XG4gICAqL1xuICBASW5wdXQoKSBob3VyU2VnbWVudEhlaWdodDogbnVtYmVyID0gMzA7XG5cbiAgLyoqXG4gICAqIFRoZSBtaW5pbXVtIGhlaWdodCBpbiBwaXhlbHMgb2YgZWFjaCBldmVudFxuICAgKi9cbiAgQElucHV0KCkgbWluaW11bUV2ZW50SGVpZ2h0OiBudW1iZXIgPSAzMDtcblxuICAvKipcbiAgICogVGhlIGRheSBzdGFydCBob3VycyBpbiAyNCBob3VyIHRpbWUuIE11c3QgYmUgMC0yM1xuICAgKi9cbiAgQElucHV0KCkgZGF5U3RhcnRIb3VyOiBudW1iZXIgPSAwO1xuXG4gIC8qKlxuICAgKiBUaGUgZGF5IHN0YXJ0IG1pbnV0ZXMuIE11c3QgYmUgMC01OVxuICAgKi9cbiAgQElucHV0KCkgZGF5U3RhcnRNaW51dGU6IG51bWJlciA9IDA7XG5cbiAgLyoqXG4gICAqIFRoZSBkYXkgZW5kIGhvdXJzIGluIDI0IGhvdXIgdGltZS4gTXVzdCBiZSAwLTIzXG4gICAqL1xuICBASW5wdXQoKSBkYXlFbmRIb3VyOiBudW1iZXIgPSAyMztcblxuICAvKipcbiAgICogVGhlIGRheSBlbmQgbWludXRlcy4gTXVzdCBiZSAwLTU5XG4gICAqL1xuICBASW5wdXQoKSBkYXlFbmRNaW51dGU6IG51bWJlciA9IDU5O1xuXG4gIC8qKlxuICAgKiBBIGN1c3RvbSB0ZW1wbGF0ZSB0byB1c2UgdG8gcmVwbGFjZSB0aGUgaG91ciBzZWdtZW50XG4gICAqL1xuICBASW5wdXQoKSBob3VyU2VnbWVudFRlbXBsYXRlOiBUZW1wbGF0ZVJlZjxhbnk+O1xuXG4gIC8qKlxuICAgKiBUaGUgZ3JpZCBzaXplIHRvIHNuYXAgcmVzaXppbmcgYW5kIGRyYWdnaW5nIG9mIGhvdXJseSBldmVudHMgdG9cbiAgICovXG4gIEBJbnB1dCgpIGV2ZW50U25hcFNpemU6IG51bWJlcjtcblxuICAvKipcbiAgICogQSBjdXN0b20gdGVtcGxhdGUgdG8gdXNlIGZvciB0aGUgYWxsIGRheSBldmVudHMgbGFiZWwgdGV4dFxuICAgKi9cbiAgQElucHV0KCkgYWxsRGF5RXZlbnRzTGFiZWxUZW1wbGF0ZTogVGVtcGxhdGVSZWY8YW55PjtcblxuICAvKipcbiAgICogVGhlIG51bWJlciBvZiBkYXlzIGluIGEgd2Vlay4gQ2FuIGJlIHVzZWQgdG8gY3JlYXRlIGEgc2hvcnRlciBvciBsb25nZXIgd2VlayB2aWV3LlxuICAgKiBUaGUgZmlyc3QgZGF5IG9mIHRoZSB3ZWVrIHdpbGwgYWx3YXlzIGJlIHRoZSBgdmlld0RhdGVgIGFuZCBgd2Vla1N0YXJ0c09uYCBpZiBzZXQgd2lsbCBiZSBpZ25vcmVkXG4gICAqL1xuICBASW5wdXQoKSBkYXlzSW5XZWVrOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEEgY3VzdG9tIHRlbXBsYXRlIHRvIHVzZSBmb3IgdGhlIGN1cnJlbnQgdGltZSBtYXJrZXJcbiAgICovXG4gIEBJbnB1dCgpIGN1cnJlbnRUaW1lTWFya2VyVGVtcGxhdGU6IFRlbXBsYXRlUmVmPGFueT47XG5cbiAgLyoqXG4gICAqIEFsbG93IHlvdSB0byBjdXN0b21pc2Ugd2hlcmUgZXZlbnRzIGNhbiBiZSBkcmFnZ2VkIGFuZCByZXNpemVkIHRvLlxuICAgKiBSZXR1cm4gdHJ1ZSB0byBhbGxvdyBkcmFnZ2luZyBhbmQgcmVzaXppbmcgdG8gdGhlIG5ldyBsb2NhdGlvbiwgb3IgZmFsc2UgdG8gcHJldmVudCBpdFxuICAgKi9cbiAgQElucHV0KCkgdmFsaWRhdGVFdmVudFRpbWVzQ2hhbmdlZDogKFxuICAgIGV2ZW50OiBDYWxlbmRhckV2ZW50VGltZXNDaGFuZ2VkRXZlbnRcbiAgKSA9PiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBDdXN0b21pc2UgdGhlIGRvY3VtZW50IGN1cnNvciB3aGVuIGRyYWdnaW5nIHRvIHJlc2l6ZSBhbiBldmVudFxuICAgKi9cbiAgQElucHV0KCkgcmVzaXplQ3Vyc29yczogUGFydGlhbDxcbiAgICBQaWNrPFJlc2l6ZUN1cnNvcnMsICdsZWZ0T3JSaWdodCcgfCAndG9wT3JCb3R0b20nPlxuICA+O1xuXG4gIC8qKlxuICAgKiBDYWxsZWQgd2hlbiBhIGhlYWRlciB3ZWVrIGRheSBpcyBjbGlja2VkLiBBZGRpbmcgYSBgY3NzQ2xhc3NgIHByb3BlcnR5IG9uIGAkZXZlbnQuZGF5YCB3aWxsIGFkZCB0aGF0IGNsYXNzIHRvIHRoZSBoZWFkZXIgZWxlbWVudFxuICAgKi9cbiAgQE91dHB1dCgpIGRheUhlYWRlckNsaWNrZWQgPSBuZXcgRXZlbnRFbWl0dGVyPHtcbiAgICBkYXk6IFdlZWtEYXk7XG4gICAgc291cmNlRXZlbnQ6IE1vdXNlRXZlbnQ7XG4gIH0+KCk7XG5cbiAgLyoqXG4gICAqIENhbGxlZCB3aGVuIGFuIGV2ZW50IHRpdGxlIGlzIGNsaWNrZWRcbiAgICovXG4gIEBPdXRwdXQoKSBldmVudENsaWNrZWQgPSBuZXcgRXZlbnRFbWl0dGVyPHtcbiAgICBldmVudDogQ2FsZW5kYXJFdmVudDtcbiAgICBzb3VyY2VFdmVudDogTW91c2VFdmVudCB8IEtleWJvYXJkRXZlbnQ7XG4gIH0+KCk7XG5cbiAgLyoqXG4gICAqIENhbGxlZCB3aGVuIGFuIGV2ZW50IGlzIHJlc2l6ZWQgb3IgZHJhZ2dlZCBhbmQgZHJvcHBlZFxuICAgKi9cbiAgQE91dHB1dCgpIGV2ZW50VGltZXNDaGFuZ2VkID1cbiAgICBuZXcgRXZlbnRFbWl0dGVyPENhbGVuZGFyRXZlbnRUaW1lc0NoYW5nZWRFdmVudD4oKTtcblxuICAvKipcbiAgICogQW4gb3V0cHV0IHRoYXQgd2lsbCBiZSBjYWxsZWQgYmVmb3JlIHRoZSB2aWV3IGlzIHJlbmRlcmVkIGZvciB0aGUgY3VycmVudCB3ZWVrLlxuICAgKiBJZiB5b3UgYWRkIHRoZSBgY3NzQ2xhc3NgIHByb3BlcnR5IHRvIGEgZGF5IGluIHRoZSBoZWFkZXIgaXQgd2lsbCBhZGQgdGhhdCBjbGFzcyB0byB0aGUgY2VsbCBlbGVtZW50IGluIHRoZSB0ZW1wbGF0ZVxuICAgKi9cbiAgQE91dHB1dCgpIGJlZm9yZVZpZXdSZW5kZXIgPVxuICAgIG5ldyBFdmVudEVtaXR0ZXI8Q2FsZW5kYXJXZWVrVmlld0JlZm9yZVJlbmRlckV2ZW50PigpO1xuXG4gIC8qKlxuICAgKiBDYWxsZWQgd2hlbiBhbiBob3VyIHNlZ21lbnQgaXMgY2xpY2tlZFxuICAgKi9cbiAgQE91dHB1dCgpIGhvdXJTZWdtZW50Q2xpY2tlZCA9IG5ldyBFdmVudEVtaXR0ZXI8e1xuICAgIGRhdGU6IERhdGU7XG4gICAgc291cmNlRXZlbnQ6IE1vdXNlRXZlbnQ7XG4gIH0+KCk7XG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIGRheXM6IFdlZWtEYXlbXTtcblxuICAvKipcbiAgICogQGhpZGRlblxuICAgKi9cbiAgdmlldzogV2Vla1ZpZXc7XG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIHJlZnJlc2hTdWJzY3JpcHRpb246IFN1YnNjcmlwdGlvbjtcblxuICAvKipcbiAgICogQGhpZGRlblxuICAgKi9cbiAgYWxsRGF5RXZlbnRSZXNpemVzOiBNYXA8V2Vla1ZpZXdBbGxEYXlFdmVudCwgV2Vla1ZpZXdBbGxEYXlFdmVudFJlc2l6ZT4gPVxuICAgIG5ldyBNYXAoKTtcblxuICAvKipcbiAgICogQGhpZGRlblxuICAgKi9cbiAgdGltZUV2ZW50UmVzaXplczogTWFwPENhbGVuZGFyRXZlbnQsIFJlc2l6ZUV2ZW50PiA9IG5ldyBNYXAoKTtcblxuICAvKipcbiAgICogQGhpZGRlblxuICAgKi9cbiAgZXZlbnREcmFnRW50ZXJCeVR5cGUgPSB7XG4gICAgYWxsRGF5OiAwLFxuICAgIHRpbWU6IDAsXG4gIH07XG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIGRyYWdBY3RpdmUgPSBmYWxzZTtcblxuICAvKipcbiAgICogQGhpZGRlblxuICAgKi9cbiAgZHJhZ0FscmVhZHlNb3ZlZCA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBAaGlkZGVuXG4gICAqL1xuICB2YWxpZGF0ZURyYWc6IFZhbGlkYXRlRHJhZztcblxuICAvKipcbiAgICogQGhpZGRlblxuICAgKi9cbiAgdmFsaWRhdGVSZXNpemU6IChhcmdzOiBhbnkpID0+IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIGRheUNvbHVtbldpZHRoOiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIGNhbGVuZGFySWQgPSBTeW1ib2woJ2FuZ3VsYXIgY2FsZW5kYXIgd2VlayB2aWV3IGlkJyk7XG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIGxhc3REcmFnZ2VkRXZlbnQ6IENhbGVuZGFyRXZlbnQ7XG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIHJ0bCA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBAaGlkZGVuXG4gICAqL1xuICB0cmFja0J5V2Vla0RheUhlYWRlckRhdGUgPSB0cmFja0J5V2Vla0RheUhlYWRlckRhdGU7XG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIHRyYWNrQnlIb3VyU2VnbWVudCA9IHRyYWNrQnlIb3VyU2VnbWVudDtcblxuICAvKipcbiAgICogQGhpZGRlblxuICAgKi9cbiAgdHJhY2tCeUhvdXIgPSB0cmFja0J5SG91cjtcblxuICAvKipcbiAgICogQGhpZGRlblxuICAgKi9cbiAgdHJhY2tCeVdlZWtBbGxEYXlFdmVudCA9IHRyYWNrQnlXZWVrQWxsRGF5RXZlbnQ7XG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIHRyYWNrQnlXZWVrVGltZUV2ZW50ID0gdHJhY2tCeVdlZWtUaW1lRXZlbnQ7XG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIHByaXZhdGUgbGFzdERyYWdFbnRlckRhdGU6IERhdGU7XG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIHByb3RlY3RlZCBjZHI6IENoYW5nZURldGVjdG9yUmVmLFxuICAgIHByb3RlY3RlZCB1dGlsczogQ2FsZW5kYXJVdGlscyxcbiAgICBASW5qZWN0KExPQ0FMRV9JRCkgbG9jYWxlOiBzdHJpbmcsXG4gICAgcHJvdGVjdGVkIGRhdGVBZGFwdGVyOiBEYXRlQWRhcHRlcixcbiAgICBwcm90ZWN0ZWQgZWxlbWVudDogRWxlbWVudFJlZjxIVE1MRWxlbWVudD5cbiAgKSB7XG4gICAgdGhpcy5sb2NhbGUgPSBsb2NhbGU7XG4gIH1cblxuICAvKipcbiAgICogQGhpZGRlblxuICAgKi9cbiAgdHJhY2tCeUhvdXJDb2x1bW4gPSAoaW5kZXg6IG51bWJlciwgY29sdW1uOiBXZWVrVmlld0hvdXJDb2x1bW4pID0+XG4gICAgY29sdW1uLmhvdXJzWzBdID8gY29sdW1uLmhvdXJzWzBdLnNlZ21lbnRzWzBdLmRhdGUudG9JU09TdHJpbmcoKSA6IGNvbHVtbjtcblxuICAvKipcbiAgICogQGhpZGRlblxuICAgKi9cbiAgdHJhY2tCeUlkID0gKGluZGV4OiBudW1iZXIsIHJvdzogV2Vla1ZpZXdBbGxEYXlFdmVudFJvdykgPT4gcm93LmlkO1xuXG4gIC8qKlxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBuZ09uSW5pdCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5yZWZyZXNoKSB7XG4gICAgICB0aGlzLnJlZnJlc2hTdWJzY3JpcHRpb24gPSB0aGlzLnJlZnJlc2guc3Vic2NyaWJlKCgpID0+IHtcbiAgICAgICAgdGhpcy5yZWZyZXNoQWxsKCk7XG4gICAgICAgIHRoaXMuY2RyLm1hcmtGb3JDaGVjaygpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIG5nT25DaGFuZ2VzKGNoYW5nZXM6IGFueSk6IHZvaWQge1xuICAgIGNvbnN0IHJlZnJlc2hIZWFkZXIgPVxuICAgICAgY2hhbmdlcy52aWV3RGF0ZSB8fFxuICAgICAgY2hhbmdlcy5leGNsdWRlRGF5cyB8fFxuICAgICAgY2hhbmdlcy53ZWVrZW5kRGF5cyB8fFxuICAgICAgY2hhbmdlcy5kYXlzSW5XZWVrIHx8XG4gICAgICBjaGFuZ2VzLndlZWtTdGFydHNPbjtcblxuICAgIGNvbnN0IHJlZnJlc2hCb2R5ID1cbiAgICAgIGNoYW5nZXMudmlld0RhdGUgfHxcbiAgICAgIGNoYW5nZXMuZGF5U3RhcnRIb3VyIHx8XG4gICAgICBjaGFuZ2VzLmRheVN0YXJ0TWludXRlIHx8XG4gICAgICBjaGFuZ2VzLmRheUVuZEhvdXIgfHxcbiAgICAgIGNoYW5nZXMuZGF5RW5kTWludXRlIHx8XG4gICAgICBjaGFuZ2VzLmhvdXJTZWdtZW50cyB8fFxuICAgICAgY2hhbmdlcy5ob3VyRHVyYXRpb24gfHxcbiAgICAgIGNoYW5nZXMud2Vla1N0YXJ0c09uIHx8XG4gICAgICBjaGFuZ2VzLndlZWtlbmREYXlzIHx8XG4gICAgICBjaGFuZ2VzLmV4Y2x1ZGVEYXlzIHx8XG4gICAgICBjaGFuZ2VzLmhvdXJTZWdtZW50SGVpZ2h0IHx8XG4gICAgICBjaGFuZ2VzLmV2ZW50cyB8fFxuICAgICAgY2hhbmdlcy5kYXlzSW5XZWVrIHx8XG4gICAgICBjaGFuZ2VzLm1pbmltdW1FdmVudEhlaWdodDtcblxuICAgIGlmIChyZWZyZXNoSGVhZGVyKSB7XG4gICAgICB0aGlzLnJlZnJlc2hIZWFkZXIoKTtcbiAgICB9XG5cbiAgICBpZiAoY2hhbmdlcy5ldmVudHMpIHtcbiAgICAgIHZhbGlkYXRlRXZlbnRzKHRoaXMuZXZlbnRzKTtcbiAgICB9XG5cbiAgICBpZiAocmVmcmVzaEJvZHkpIHtcbiAgICAgIHRoaXMucmVmcmVzaEJvZHkoKTtcbiAgICB9XG5cbiAgICBpZiAocmVmcmVzaEhlYWRlciB8fCByZWZyZXNoQm9keSkge1xuICAgICAgdGhpcy5lbWl0QmVmb3JlVmlld1JlbmRlcigpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBuZ09uRGVzdHJveSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5yZWZyZXNoU3Vic2NyaXB0aW9uKSB7XG4gICAgICB0aGlzLnJlZnJlc2hTdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQGhpZGRlblxuICAgKi9cbiAgbmdBZnRlclZpZXdJbml0KCkge1xuICAgIHRoaXMucnRsID1cbiAgICAgIHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmXG4gICAgICBnZXRDb21wdXRlZFN0eWxlKHRoaXMuZWxlbWVudC5uYXRpdmVFbGVtZW50KS5kaXJlY3Rpb24gPT09ICdydGwnO1xuICAgIHRoaXMuY2RyLmRldGVjdENoYW5nZXMoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaGlkZGVuXG4gICAqL1xuICB0aW1lRXZlbnRSZXNpemVTdGFydGVkKFxuICAgIGV2ZW50c0NvbnRhaW5lcjogSFRNTEVsZW1lbnQsXG4gICAgdGltZUV2ZW50OiBXZWVrVmlld1RpbWVFdmVudCxcbiAgICByZXNpemVFdmVudDogUmVzaXplRXZlbnRcbiAgKTogdm9pZCB7XG4gICAgdGhpcy50aW1lRXZlbnRSZXNpemVzLnNldCh0aW1lRXZlbnQuZXZlbnQsIHJlc2l6ZUV2ZW50KTtcbiAgICB0aGlzLnJlc2l6ZVN0YXJ0ZWQoZXZlbnRzQ29udGFpbmVyLCB0aW1lRXZlbnQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIHRpbWVFdmVudFJlc2l6aW5nKHRpbWVFdmVudDogV2Vla1ZpZXdUaW1lRXZlbnQsIHJlc2l6ZUV2ZW50OiBSZXNpemVFdmVudCkge1xuICAgIHRoaXMudGltZUV2ZW50UmVzaXplcy5zZXQodGltZUV2ZW50LmV2ZW50LCByZXNpemVFdmVudCk7XG4gICAgY29uc3QgYWRqdXN0ZWRFdmVudHMgPSBuZXcgTWFwPENhbGVuZGFyRXZlbnQsIENhbGVuZGFyRXZlbnQ+KCk7XG5cbiAgICBjb25zdCB0ZW1wRXZlbnRzID0gWy4uLnRoaXMuZXZlbnRzXTtcblxuICAgIHRoaXMudGltZUV2ZW50UmVzaXplcy5mb3JFYWNoKChsYXN0UmVzaXplRXZlbnQsIGV2ZW50KSA9PiB7XG4gICAgICBjb25zdCBuZXdFdmVudERhdGVzID0gdGhpcy5nZXRUaW1lRXZlbnRSZXNpemVkRGF0ZXMoXG4gICAgICAgIGV2ZW50LFxuICAgICAgICBsYXN0UmVzaXplRXZlbnRcbiAgICAgICk7XG4gICAgICBjb25zdCBhZGp1c3RlZEV2ZW50ID0geyAuLi5ldmVudCwgLi4ubmV3RXZlbnREYXRlcyB9O1xuICAgICAgYWRqdXN0ZWRFdmVudHMuc2V0KGFkanVzdGVkRXZlbnQsIGV2ZW50KTtcbiAgICAgIGNvbnN0IGV2ZW50SW5kZXggPSB0ZW1wRXZlbnRzLmluZGV4T2YoZXZlbnQpO1xuICAgICAgdGVtcEV2ZW50c1tldmVudEluZGV4XSA9IGFkanVzdGVkRXZlbnQ7XG4gICAgfSk7XG5cbiAgICB0aGlzLnJlc3RvcmVPcmlnaW5hbEV2ZW50cyh0ZW1wRXZlbnRzLCBhZGp1c3RlZEV2ZW50cywgdHJ1ZSk7XG4gIH1cblxuICAvKipcbiAgICogQGhpZGRlblxuICAgKi9cbiAgdGltZUV2ZW50UmVzaXplRW5kZWQodGltZUV2ZW50OiBXZWVrVmlld1RpbWVFdmVudCkge1xuICAgIHRoaXMudmlldyA9IHRoaXMuZ2V0V2Vla1ZpZXcodGhpcy5ldmVudHMpO1xuICAgIGNvbnN0IGxhc3RSZXNpemVFdmVudCA9IHRoaXMudGltZUV2ZW50UmVzaXplcy5nZXQodGltZUV2ZW50LmV2ZW50KTtcbiAgICBpZiAobGFzdFJlc2l6ZUV2ZW50KSB7XG4gICAgICB0aGlzLnRpbWVFdmVudFJlc2l6ZXMuZGVsZXRlKHRpbWVFdmVudC5ldmVudCk7XG4gICAgICBjb25zdCBuZXdFdmVudERhdGVzID0gdGhpcy5nZXRUaW1lRXZlbnRSZXNpemVkRGF0ZXMoXG4gICAgICAgIHRpbWVFdmVudC5ldmVudCxcbiAgICAgICAgbGFzdFJlc2l6ZUV2ZW50XG4gICAgICApO1xuICAgICAgdGhpcy5ldmVudFRpbWVzQ2hhbmdlZC5lbWl0KHtcbiAgICAgICAgbmV3U3RhcnQ6IG5ld0V2ZW50RGF0ZXMuc3RhcnQsXG4gICAgICAgIG5ld0VuZDogbmV3RXZlbnREYXRlcy5lbmQsXG4gICAgICAgIGV2ZW50OiB0aW1lRXZlbnQuZXZlbnQsXG4gICAgICAgIHR5cGU6IENhbGVuZGFyRXZlbnRUaW1lc0NoYW5nZWRFdmVudFR5cGUuUmVzaXplLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIGFsbERheUV2ZW50UmVzaXplU3RhcnRlZChcbiAgICBhbGxEYXlFdmVudHNDb250YWluZXI6IEhUTUxFbGVtZW50LFxuICAgIGFsbERheUV2ZW50OiBXZWVrVmlld0FsbERheUV2ZW50LFxuICAgIHJlc2l6ZUV2ZW50OiBSZXNpemVFdmVudFxuICApOiB2b2lkIHtcbiAgICB0aGlzLmFsbERheUV2ZW50UmVzaXplcy5zZXQoYWxsRGF5RXZlbnQsIHtcbiAgICAgIG9yaWdpbmFsT2Zmc2V0OiBhbGxEYXlFdmVudC5vZmZzZXQsXG4gICAgICBvcmlnaW5hbFNwYW46IGFsbERheUV2ZW50LnNwYW4sXG4gICAgICBlZGdlOiB0eXBlb2YgcmVzaXplRXZlbnQuZWRnZXMubGVmdCAhPT0gJ3VuZGVmaW5lZCcgPyAnbGVmdCcgOiAncmlnaHQnLFxuICAgIH0pO1xuICAgIHRoaXMucmVzaXplU3RhcnRlZChcbiAgICAgIGFsbERheUV2ZW50c0NvbnRhaW5lcixcbiAgICAgIGFsbERheUV2ZW50LFxuICAgICAgdGhpcy5nZXREYXlDb2x1bW5XaWR0aChhbGxEYXlFdmVudHNDb250YWluZXIpXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBhbGxEYXlFdmVudFJlc2l6aW5nKFxuICAgIGFsbERheUV2ZW50OiBXZWVrVmlld0FsbERheUV2ZW50LFxuICAgIHJlc2l6ZUV2ZW50OiBSZXNpemVFdmVudCxcbiAgICBkYXlXaWR0aDogbnVtYmVyXG4gICk6IHZvaWQge1xuICAgIGNvbnN0IGN1cnJlbnRSZXNpemU6IFdlZWtWaWV3QWxsRGF5RXZlbnRSZXNpemUgPVxuICAgICAgdGhpcy5hbGxEYXlFdmVudFJlc2l6ZXMuZ2V0KGFsbERheUV2ZW50KTtcblxuICAgIGNvbnN0IG1vZGlmaWVyID0gdGhpcy5ydGwgPyAtMSA6IDE7XG4gICAgaWYgKHR5cGVvZiByZXNpemVFdmVudC5lZGdlcy5sZWZ0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgY29uc3QgZGlmZjogbnVtYmVyID1cbiAgICAgICAgTWF0aC5yb3VuZCgrcmVzaXplRXZlbnQuZWRnZXMubGVmdCAvIGRheVdpZHRoKSAqIG1vZGlmaWVyO1xuICAgICAgYWxsRGF5RXZlbnQub2Zmc2V0ID0gY3VycmVudFJlc2l6ZS5vcmlnaW5hbE9mZnNldCArIGRpZmY7XG4gICAgICBhbGxEYXlFdmVudC5zcGFuID0gY3VycmVudFJlc2l6ZS5vcmlnaW5hbFNwYW4gLSBkaWZmO1xuICAgIH0gZWxzZSBpZiAodHlwZW9mIHJlc2l6ZUV2ZW50LmVkZ2VzLnJpZ2h0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgY29uc3QgZGlmZjogbnVtYmVyID1cbiAgICAgICAgTWF0aC5yb3VuZCgrcmVzaXplRXZlbnQuZWRnZXMucmlnaHQgLyBkYXlXaWR0aCkgKiBtb2RpZmllcjtcbiAgICAgIGFsbERheUV2ZW50LnNwYW4gPSBjdXJyZW50UmVzaXplLm9yaWdpbmFsU3BhbiArIGRpZmY7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIGFsbERheUV2ZW50UmVzaXplRW5kZWQoYWxsRGF5RXZlbnQ6IFdlZWtWaWV3QWxsRGF5RXZlbnQpOiB2b2lkIHtcbiAgICBjb25zdCBjdXJyZW50UmVzaXplOiBXZWVrVmlld0FsbERheUV2ZW50UmVzaXplID1cbiAgICAgIHRoaXMuYWxsRGF5RXZlbnRSZXNpemVzLmdldChhbGxEYXlFdmVudCk7XG5cbiAgICBpZiAoY3VycmVudFJlc2l6ZSkge1xuICAgICAgY29uc3QgYWxsRGF5RXZlbnRSZXNpemluZ0JlZm9yZVN0YXJ0ID0gY3VycmVudFJlc2l6ZS5lZGdlID09PSAnbGVmdCc7XG4gICAgICBsZXQgZGF5c0RpZmY6IG51bWJlcjtcbiAgICAgIGlmIChhbGxEYXlFdmVudFJlc2l6aW5nQmVmb3JlU3RhcnQpIHtcbiAgICAgICAgZGF5c0RpZmYgPSBhbGxEYXlFdmVudC5vZmZzZXQgLSBjdXJyZW50UmVzaXplLm9yaWdpbmFsT2Zmc2V0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGF5c0RpZmYgPSBhbGxEYXlFdmVudC5zcGFuIC0gY3VycmVudFJlc2l6ZS5vcmlnaW5hbFNwYW47XG4gICAgICB9XG5cbiAgICAgIGFsbERheUV2ZW50Lm9mZnNldCA9IGN1cnJlbnRSZXNpemUub3JpZ2luYWxPZmZzZXQ7XG4gICAgICBhbGxEYXlFdmVudC5zcGFuID0gY3VycmVudFJlc2l6ZS5vcmlnaW5hbFNwYW47XG5cbiAgICAgIGNvbnN0IG5ld0RhdGVzID0gdGhpcy5nZXRBbGxEYXlFdmVudFJlc2l6ZWREYXRlcyhcbiAgICAgICAgYWxsRGF5RXZlbnQuZXZlbnQsXG4gICAgICAgIGRheXNEaWZmLFxuICAgICAgICBhbGxEYXlFdmVudFJlc2l6aW5nQmVmb3JlU3RhcnRcbiAgICAgICk7XG5cbiAgICAgIHRoaXMuZXZlbnRUaW1lc0NoYW5nZWQuZW1pdCh7XG4gICAgICAgIG5ld1N0YXJ0OiBuZXdEYXRlcy5zdGFydCxcbiAgICAgICAgbmV3RW5kOiBuZXdEYXRlcy5lbmQsXG4gICAgICAgIGV2ZW50OiBhbGxEYXlFdmVudC5ldmVudCxcbiAgICAgICAgdHlwZTogQ2FsZW5kYXJFdmVudFRpbWVzQ2hhbmdlZEV2ZW50VHlwZS5SZXNpemUsXG4gICAgICB9KTtcbiAgICAgIHRoaXMuYWxsRGF5RXZlbnRSZXNpemVzLmRlbGV0ZShhbGxEYXlFdmVudCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIGdldERheUNvbHVtbldpZHRoKGV2ZW50Um93Q29udGFpbmVyOiBIVE1MRWxlbWVudCk6IG51bWJlciB7XG4gICAgcmV0dXJuIE1hdGguZmxvb3IoZXZlbnRSb3dDb250YWluZXIub2Zmc2V0V2lkdGggLyB0aGlzLmRheXMubGVuZ3RoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBkYXRlRHJhZ0VudGVyKGRhdGU6IERhdGUpIHtcbiAgICB0aGlzLmxhc3REcmFnRW50ZXJEYXRlID0gZGF0ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBldmVudERyb3BwZWQoXG4gICAgZHJvcEV2ZW50OiBQaWNrPFxuICAgICAgRHJvcEV2ZW50PHsgZXZlbnQ/OiBDYWxlbmRhckV2ZW50OyBjYWxlbmRhcklkPzogc3ltYm9sIH0+LFxuICAgICAgJ2Ryb3BEYXRhJ1xuICAgID4sXG4gICAgZGF0ZTogRGF0ZSxcbiAgICBhbGxEYXk6IGJvb2xlYW5cbiAgKTogdm9pZCB7XG4gICAgaWYgKFxuICAgICAgc2hvdWxkRmlyZURyb3BwZWRFdmVudChkcm9wRXZlbnQsIGRhdGUsIGFsbERheSwgdGhpcy5jYWxlbmRhcklkKSAmJlxuICAgICAgdGhpcy5sYXN0RHJhZ0VudGVyRGF0ZS5nZXRUaW1lKCkgPT09IGRhdGUuZ2V0VGltZSgpICYmXG4gICAgICAoIXRoaXMuc25hcERyYWdnZWRFdmVudHMgfHxcbiAgICAgICAgZHJvcEV2ZW50LmRyb3BEYXRhLmV2ZW50ICE9PSB0aGlzLmxhc3REcmFnZ2VkRXZlbnQpXG4gICAgKSB7XG4gICAgICB0aGlzLmV2ZW50VGltZXNDaGFuZ2VkLmVtaXQoe1xuICAgICAgICB0eXBlOiBDYWxlbmRhckV2ZW50VGltZXNDaGFuZ2VkRXZlbnRUeXBlLkRyb3AsXG4gICAgICAgIGV2ZW50OiBkcm9wRXZlbnQuZHJvcERhdGEuZXZlbnQsXG4gICAgICAgIG5ld1N0YXJ0OiBkYXRlLFxuICAgICAgICBhbGxEYXksXG4gICAgICB9KTtcbiAgICB9XG4gICAgdGhpcy5sYXN0RHJhZ2dlZEV2ZW50ID0gbnVsbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBkcmFnRW50ZXIodHlwZTogJ2FsbERheScgfCAndGltZScpIHtcbiAgICB0aGlzLmV2ZW50RHJhZ0VudGVyQnlUeXBlW3R5cGVdKys7XG4gIH1cblxuICAvKipcbiAgICogQGhpZGRlblxuICAgKi9cbiAgZHJhZ0xlYXZlKHR5cGU6ICdhbGxEYXknIHwgJ3RpbWUnKSB7XG4gICAgdGhpcy5ldmVudERyYWdFbnRlckJ5VHlwZVt0eXBlXS0tO1xuICB9XG5cbiAgLyoqXG4gICAqIEBoaWRkZW5cbiAgICovXG4gIGRyYWdTdGFydGVkKFxuICAgIGV2ZW50c0NvbnRhaW5lckVsZW1lbnQ6IEhUTUxFbGVtZW50LFxuICAgIGV2ZW50RWxlbWVudDogSFRNTEVsZW1lbnQsXG4gICAgZXZlbnQ6IFdlZWtWaWV3VGltZUV2ZW50IHwgV2Vla1ZpZXdBbGxEYXlFdmVudCxcbiAgICB1c2VZOiBib29sZWFuXG4gICk6IHZvaWQge1xuICAgIHRoaXMuZGF5Q29sdW1uV2lkdGggPSB0aGlzLmdldERheUNvbHVtbldpZHRoKGV2ZW50c0NvbnRhaW5lckVsZW1lbnQpO1xuICAgIGNvbnN0IGRyYWdIZWxwZXI6IENhbGVuZGFyRHJhZ0hlbHBlciA9IG5ldyBDYWxlbmRhckRyYWdIZWxwZXIoXG4gICAgICBldmVudHNDb250YWluZXJFbGVtZW50LFxuICAgICAgZXZlbnRFbGVtZW50XG4gICAgKTtcbiAgICB0aGlzLnZhbGlkYXRlRHJhZyA9ICh7IHgsIHksIHRyYW5zZm9ybSB9KSA9PiB7XG4gICAgICBjb25zdCBpc0FsbG93ZWQgPVxuICAgICAgICB0aGlzLmFsbERheUV2ZW50UmVzaXplcy5zaXplID09PSAwICYmXG4gICAgICAgIHRoaXMudGltZUV2ZW50UmVzaXplcy5zaXplID09PSAwICYmXG4gICAgICAgIGRyYWdIZWxwZXIudmFsaWRhdGVEcmFnKHtcbiAgICAgICAgICB4LFxuICAgICAgICAgIHksXG4gICAgICAgICAgc25hcERyYWdnZWRFdmVudHM6IHRoaXMuc25hcERyYWdnZWRFdmVudHMsXG4gICAgICAgICAgZHJhZ0FscmVhZHlNb3ZlZDogdGhpcy5kcmFnQWxyZWFkeU1vdmVkLFxuICAgICAgICAgIHRyYW5zZm9ybSxcbiAgICAgICAgfSk7XG4gICAgICBpZiAoaXNBbGxvd2VkICYmIHRoaXMudmFsaWRhdGVFdmVudFRpbWVzQ2hhbmdlZCkge1xuICAgICAgICBjb25zdCBuZXdFdmVudFRpbWVzID0gdGhpcy5nZXREcmFnTW92ZWRFdmVudFRpbWVzKFxuICAgICAgICAgIGV2ZW50LFxuICAgICAgICAgIHsgeCwgeSB9LFxuICAgICAgICAgIHRoaXMuZGF5Q29sdW1uV2lkdGgsXG4gICAgICAgICAgdXNlWVxuICAgICAgICApO1xuICAgICAgICByZXR1cm4gdGhpcy52YWxpZGF0ZUV2ZW50VGltZXNDaGFuZ2VkKHtcbiAgICAgICAgICB0eXBlOiBDYWxlbmRhckV2ZW50VGltZXNDaGFuZ2VkRXZlbnRUeXBlLkRyYWcsXG4gICAgICAgICAgZXZlbnQ6IGV2ZW50LmV2ZW50LFxuICAgICAgICAgIG5ld1N0YXJ0OiBuZXdFdmVudFRpbWVzLnN0YXJ0LFxuICAgICAgICAgIG5ld0VuZDogbmV3RXZlbnRUaW1lcy5lbmQsXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gaXNBbGxvd2VkO1xuICAgIH07XG4gICAgdGhpcy5kcmFnQWN0aXZlID0gdHJ1ZTtcbiAgICB0aGlzLmRyYWdBbHJlYWR5TW92ZWQgPSBmYWxzZTtcbiAgICB0aGlzLmxhc3REcmFnZ2VkRXZlbnQgPSBudWxsO1xuICAgIHRoaXMuZXZlbnREcmFnRW50ZXJCeVR5cGUgPSB7XG4gICAgICBhbGxEYXk6IDAsXG4gICAgICB0aW1lOiAwLFxuICAgIH07XG4gICAgaWYgKCF0aGlzLnNuYXBEcmFnZ2VkRXZlbnRzICYmIHVzZVkpIHtcbiAgICAgIHRoaXMudmlldy5ob3VyQ29sdW1ucy5mb3JFYWNoKChjb2x1bW4pID0+IHtcbiAgICAgICAgY29uc3QgbGlua2VkRXZlbnQgPSBjb2x1bW4uZXZlbnRzLmZpbmQoXG4gICAgICAgICAgKGNvbHVtbkV2ZW50KSA9PlxuICAgICAgICAgICAgY29sdW1uRXZlbnQuZXZlbnQgPT09IGV2ZW50LmV2ZW50ICYmIGNvbHVtbkV2ZW50ICE9PSBldmVudFxuICAgICAgICApO1xuICAgICAgICAvLyBoaWRlIGFueSBsaW5rZWQgZXZlbnRzIHdoaWxlIGRyYWdnaW5nXG4gICAgICAgIGlmIChsaW5rZWRFdmVudCkge1xuICAgICAgICAgIGxpbmtlZEV2ZW50LndpZHRoID0gMDtcbiAgICAgICAgICBsaW5rZWRFdmVudC5oZWlnaHQgPSAwO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgdGhpcy5jZHIubWFya0ZvckNoZWNrKCk7XG4gIH1cblxuICAvKipcbiAgICogQGhpZGRlblxuICAgKi9cbiAgZHJhZ01vdmUoZGF5RXZlbnQ6IFdlZWtWaWV3VGltZUV2ZW50LCBkcmFnRXZlbnQ6IERyYWdNb3ZlRXZlbnQpIHtcbiAgICBjb25zdCBuZXdFdmVudFRpbWVzID0gdGhpcy5nZXREcmFnTW92ZWRFdmVudFRpbWVzKFxuICAgICAgZGF5RXZlbnQsXG4gICAgICBkcmFnRXZlbnQsXG4gICAgICB0aGlzLmRheUNvbHVtbldpZHRoLFxuICAgICAgdHJ1ZVxuICAgICk7XG4gICAgY29uc3Qgb3JpZ2luYWxFdmVudCA9IGRheUV2ZW50LmV2ZW50O1xuICAgIGNvbnN0IGFkanVzdGVkRXZlbnQgPSB7IC4uLm9yaWdpbmFsRXZlbnQsIC4uLm5ld0V2ZW50VGltZXMgfTtcbiAgICBjb25zdCB0ZW1wRXZlbnRzID0gdGhpcy5ldmVudHMubWFwKChldmVudCkgPT4ge1xuICAgICAgaWYgKGV2ZW50ID09PSBvcmlnaW5hbEV2ZW50KSB7XG4gICAgICAgIHJldHVybiBhZGp1c3RlZEV2ZW50O1xuICAgICAgfVxuICAgICAgcmV0dXJuIGV2ZW50O1xuICAgIH0pO1xuICAgIHRoaXMucmVzdG9yZU9yaWdpbmFsRXZlbnRzKFxuICAgICAgdGVtcEV2ZW50cyxcbiAgICAgIG5ldyBNYXAoW1thZGp1c3RlZEV2ZW50LCBvcmlnaW5hbEV2ZW50XV0pLFxuICAgICAgdGhpcy5zbmFwRHJhZ2dlZEV2ZW50c1xuICAgICk7XG4gICAgdGhpcy5kcmFnQWxyZWFkeU1vdmVkID0gdHJ1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBhbGxEYXlFdmVudERyYWdNb3ZlKCkge1xuICAgIHRoaXMuZHJhZ0FscmVhZHlNb3ZlZCA9IHRydWU7XG4gIH1cblxuICAvKipcbiAgICogQGhpZGRlblxuICAgKi9cbiAgZHJhZ0VuZGVkKFxuICAgIHdlZWtFdmVudDogV2Vla1ZpZXdBbGxEYXlFdmVudCB8IFdlZWtWaWV3VGltZUV2ZW50LFxuICAgIGRyYWdFbmRFdmVudDogRHJhZ0VuZEV2ZW50LFxuICAgIGRheVdpZHRoOiBudW1iZXIsXG4gICAgdXNlWSA9IGZhbHNlXG4gICk6IHZvaWQge1xuICAgIHRoaXMudmlldyA9IHRoaXMuZ2V0V2Vla1ZpZXcodGhpcy5ldmVudHMpO1xuICAgIHRoaXMuZHJhZ0FjdGl2ZSA9IGZhbHNlO1xuICAgIHRoaXMudmFsaWRhdGVEcmFnID0gbnVsbDtcbiAgICBjb25zdCB7IHN0YXJ0LCBlbmQgfSA9IHRoaXMuZ2V0RHJhZ01vdmVkRXZlbnRUaW1lcyhcbiAgICAgIHdlZWtFdmVudCxcbiAgICAgIGRyYWdFbmRFdmVudCxcbiAgICAgIGRheVdpZHRoLFxuICAgICAgdXNlWVxuICAgICk7XG4gICAgaWYgKFxuICAgICAgKHRoaXMuc25hcERyYWdnZWRFdmVudHMgfHxcbiAgICAgICAgdGhpcy5ldmVudERyYWdFbnRlckJ5VHlwZVt1c2VZID8gJ3RpbWUnIDogJ2FsbERheSddID4gMCkgJiZcbiAgICAgIGlzRHJhZ2dlZFdpdGhpblBlcmlvZChzdGFydCwgZW5kLCB0aGlzLnZpZXcucGVyaW9kKVxuICAgICkge1xuICAgICAgdGhpcy5sYXN0RHJhZ2dlZEV2ZW50ID0gd2Vla0V2ZW50LmV2ZW50O1xuICAgICAgdGhpcy5ldmVudFRpbWVzQ2hhbmdlZC5lbWl0KHtcbiAgICAgICAgbmV3U3RhcnQ6IHN0YXJ0LFxuICAgICAgICBuZXdFbmQ6IGVuZCxcbiAgICAgICAgZXZlbnQ6IHdlZWtFdmVudC5ldmVudCxcbiAgICAgICAgdHlwZTogQ2FsZW5kYXJFdmVudFRpbWVzQ2hhbmdlZEV2ZW50VHlwZS5EcmFnLFxuICAgICAgICBhbGxEYXk6ICF1c2VZLFxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgcHJvdGVjdGVkIHJlZnJlc2hIZWFkZXIoKTogdm9pZCB7XG4gICAgdGhpcy5kYXlzID0gdGhpcy51dGlscy5nZXRXZWVrVmlld0hlYWRlcih7XG4gICAgICB2aWV3RGF0ZTogdGhpcy52aWV3RGF0ZSxcbiAgICAgIHdlZWtTdGFydHNPbjogdGhpcy53ZWVrU3RhcnRzT24sXG4gICAgICBleGNsdWRlZDogdGhpcy5leGNsdWRlRGF5cyxcbiAgICAgIHdlZWtlbmREYXlzOiB0aGlzLndlZWtlbmREYXlzLFxuICAgICAgLi4uZ2V0V2Vla1ZpZXdQZXJpb2QoXG4gICAgICAgIHRoaXMuZGF0ZUFkYXB0ZXIsXG4gICAgICAgIHRoaXMudmlld0RhdGUsXG4gICAgICAgIHRoaXMud2Vla1N0YXJ0c09uLFxuICAgICAgICB0aGlzLmV4Y2x1ZGVEYXlzLFxuICAgICAgICB0aGlzLmRheXNJbldlZWtcbiAgICAgICksXG4gICAgfSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgcmVmcmVzaEJvZHkoKTogdm9pZCB7XG4gICAgdGhpcy52aWV3ID0gdGhpcy5nZXRXZWVrVmlldyh0aGlzLmV2ZW50cyk7XG4gIH1cblxuICBwcm90ZWN0ZWQgcmVmcmVzaEFsbCgpOiB2b2lkIHtcbiAgICB0aGlzLnJlZnJlc2hIZWFkZXIoKTtcbiAgICB0aGlzLnJlZnJlc2hCb2R5KCk7XG4gICAgdGhpcy5lbWl0QmVmb3JlVmlld1JlbmRlcigpO1xuICB9XG5cbiAgcHJvdGVjdGVkIGVtaXRCZWZvcmVWaWV3UmVuZGVyKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLmRheXMgJiYgdGhpcy52aWV3KSB7XG4gICAgICB0aGlzLmJlZm9yZVZpZXdSZW5kZXIuZW1pdCh7XG4gICAgICAgIGhlYWRlcjogdGhpcy5kYXlzLFxuICAgICAgICAuLi50aGlzLnZpZXcsXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBwcm90ZWN0ZWQgZ2V0V2Vla1ZpZXcoZXZlbnRzOiBDYWxlbmRhckV2ZW50W10pIHtcbiAgICByZXR1cm4gdGhpcy51dGlscy5nZXRXZWVrVmlldyh7XG4gICAgICBldmVudHMsXG4gICAgICB2aWV3RGF0ZTogdGhpcy52aWV3RGF0ZSxcbiAgICAgIHdlZWtTdGFydHNPbjogdGhpcy53ZWVrU3RhcnRzT24sXG4gICAgICBleGNsdWRlZDogdGhpcy5leGNsdWRlRGF5cyxcbiAgICAgIHByZWNpc2lvbjogdGhpcy5wcmVjaXNpb24sXG4gICAgICBhYnNvbHV0ZVBvc2l0aW9uZWRFdmVudHM6IHRydWUsXG4gICAgICBob3VyU2VnbWVudHM6IHRoaXMuaG91clNlZ21lbnRzLFxuICAgICAgaG91ckR1cmF0aW9uOiB0aGlzLmhvdXJEdXJhdGlvbixcbiAgICAgIGRheVN0YXJ0OiB7XG4gICAgICAgIGhvdXI6IHRoaXMuZGF5U3RhcnRIb3VyLFxuICAgICAgICBtaW51dGU6IHRoaXMuZGF5U3RhcnRNaW51dGUsXG4gICAgICB9LFxuICAgICAgZGF5RW5kOiB7XG4gICAgICAgIGhvdXI6IHRoaXMuZGF5RW5kSG91cixcbiAgICAgICAgbWludXRlOiB0aGlzLmRheUVuZE1pbnV0ZSxcbiAgICAgIH0sXG4gICAgICBzZWdtZW50SGVpZ2h0OiB0aGlzLmhvdXJTZWdtZW50SGVpZ2h0LFxuICAgICAgd2Vla2VuZERheXM6IHRoaXMud2Vla2VuZERheXMsXG4gICAgICBtaW5pbXVtRXZlbnRIZWlnaHQ6IHRoaXMubWluaW11bUV2ZW50SGVpZ2h0LFxuICAgICAgLi4uZ2V0V2Vla1ZpZXdQZXJpb2QoXG4gICAgICAgIHRoaXMuZGF0ZUFkYXB0ZXIsXG4gICAgICAgIHRoaXMudmlld0RhdGUsXG4gICAgICAgIHRoaXMud2Vla1N0YXJ0c09uLFxuICAgICAgICB0aGlzLmV4Y2x1ZGVEYXlzLFxuICAgICAgICB0aGlzLmRheXNJbldlZWtcbiAgICAgICksXG4gICAgfSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgZ2V0RHJhZ01vdmVkRXZlbnRUaW1lcyhcbiAgICB3ZWVrRXZlbnQ6IFdlZWtWaWV3QWxsRGF5RXZlbnQgfCBXZWVrVmlld1RpbWVFdmVudCxcbiAgICBkcmFnRW5kRXZlbnQ6IERyYWdFbmRFdmVudCB8IERyYWdNb3ZlRXZlbnQsXG4gICAgZGF5V2lkdGg6IG51bWJlcixcbiAgICB1c2VZOiBib29sZWFuXG4gICkge1xuICAgIGNvbnN0IGRheXNEcmFnZ2VkID1cbiAgICAgIChyb3VuZFRvTmVhcmVzdChkcmFnRW5kRXZlbnQueCwgZGF5V2lkdGgpIC8gZGF5V2lkdGgpICpcbiAgICAgICh0aGlzLnJ0bCA/IC0xIDogMSk7XG4gICAgY29uc3QgbWludXRlc01vdmVkID0gdXNlWVxuICAgICAgPyBnZXRNaW51dGVzTW92ZWQoXG4gICAgICAgICAgZHJhZ0VuZEV2ZW50LnksXG4gICAgICAgICAgdGhpcy5ob3VyU2VnbWVudHMsXG4gICAgICAgICAgdGhpcy5ob3VyU2VnbWVudEhlaWdodCxcbiAgICAgICAgICB0aGlzLmV2ZW50U25hcFNpemUsXG4gICAgICAgICAgdGhpcy5ob3VyRHVyYXRpb25cbiAgICAgICAgKVxuICAgICAgOiAwO1xuXG4gICAgY29uc3Qgc3RhcnQgPSB0aGlzLmRhdGVBZGFwdGVyLmFkZE1pbnV0ZXMoXG4gICAgICBhZGREYXlzV2l0aEV4Y2x1c2lvbnMoXG4gICAgICAgIHRoaXMuZGF0ZUFkYXB0ZXIsXG4gICAgICAgIHdlZWtFdmVudC5ldmVudC5zdGFydCxcbiAgICAgICAgZGF5c0RyYWdnZWQsXG4gICAgICAgIHRoaXMuZXhjbHVkZURheXNcbiAgICAgICksXG4gICAgICBtaW51dGVzTW92ZWRcbiAgICApO1xuICAgIGxldCBlbmQ6IERhdGU7XG4gICAgaWYgKHdlZWtFdmVudC5ldmVudC5lbmQpIHtcbiAgICAgIGVuZCA9IHRoaXMuZGF0ZUFkYXB0ZXIuYWRkTWludXRlcyhcbiAgICAgICAgYWRkRGF5c1dpdGhFeGNsdXNpb25zKFxuICAgICAgICAgIHRoaXMuZGF0ZUFkYXB0ZXIsXG4gICAgICAgICAgd2Vla0V2ZW50LmV2ZW50LmVuZCxcbiAgICAgICAgICBkYXlzRHJhZ2dlZCxcbiAgICAgICAgICB0aGlzLmV4Y2x1ZGVEYXlzXG4gICAgICAgICksXG4gICAgICAgIG1pbnV0ZXNNb3ZlZFxuICAgICAgKTtcbiAgICB9XG5cbiAgICByZXR1cm4geyBzdGFydCwgZW5kIH07XG4gIH1cblxuICBwcm90ZWN0ZWQgcmVzdG9yZU9yaWdpbmFsRXZlbnRzKFxuICAgIHRlbXBFdmVudHM6IENhbGVuZGFyRXZlbnRbXSxcbiAgICBhZGp1c3RlZEV2ZW50czogTWFwPENhbGVuZGFyRXZlbnQsIENhbGVuZGFyRXZlbnQ+LFxuICAgIHNuYXBEcmFnZ2VkRXZlbnRzID0gdHJ1ZVxuICApIHtcbiAgICBjb25zdCBwcmV2aW91c1ZpZXcgPSB0aGlzLnZpZXc7XG4gICAgaWYgKHNuYXBEcmFnZ2VkRXZlbnRzKSB7XG4gICAgICB0aGlzLnZpZXcgPSB0aGlzLmdldFdlZWtWaWV3KHRlbXBFdmVudHMpO1xuICAgIH1cblxuICAgIGNvbnN0IGFkanVzdGVkRXZlbnRzQXJyYXkgPSB0ZW1wRXZlbnRzLmZpbHRlcigoZXZlbnQpID0+XG4gICAgICBhZGp1c3RlZEV2ZW50cy5oYXMoZXZlbnQpXG4gICAgKTtcbiAgICB0aGlzLnZpZXcuaG91ckNvbHVtbnMuZm9yRWFjaCgoY29sdW1uLCBjb2x1bW5JbmRleCkgPT4ge1xuICAgICAgcHJldmlvdXNWaWV3LmhvdXJDb2x1bW5zW2NvbHVtbkluZGV4XS5ob3Vycy5mb3JFYWNoKChob3VyLCBob3VySW5kZXgpID0+IHtcbiAgICAgICAgaG91ci5zZWdtZW50cy5mb3JFYWNoKChzZWdtZW50LCBzZWdtZW50SW5kZXgpID0+IHtcbiAgICAgICAgICBjb2x1bW4uaG91cnNbaG91ckluZGV4XS5zZWdtZW50c1tzZWdtZW50SW5kZXhdLmNzc0NsYXNzID1cbiAgICAgICAgICAgIHNlZ21lbnQuY3NzQ2xhc3M7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGFkanVzdGVkRXZlbnRzQXJyYXkuZm9yRWFjaCgoYWRqdXN0ZWRFdmVudCkgPT4ge1xuICAgICAgICBjb25zdCBvcmlnaW5hbEV2ZW50ID0gYWRqdXN0ZWRFdmVudHMuZ2V0KGFkanVzdGVkRXZlbnQpO1xuICAgICAgICBjb25zdCBleGlzdGluZ0NvbHVtbkV2ZW50ID0gY29sdW1uLmV2ZW50cy5maW5kKFxuICAgICAgICAgIChjb2x1bW5FdmVudCkgPT5cbiAgICAgICAgICAgIGNvbHVtbkV2ZW50LmV2ZW50ID09PVxuICAgICAgICAgICAgKHNuYXBEcmFnZ2VkRXZlbnRzID8gYWRqdXN0ZWRFdmVudCA6IG9yaWdpbmFsRXZlbnQpXG4gICAgICAgICk7XG4gICAgICAgIGlmIChleGlzdGluZ0NvbHVtbkV2ZW50KSB7XG4gICAgICAgICAgLy8gcmVzdG9yZSB0aGUgb3JpZ2luYWwgZXZlbnQgc28gdHJhY2tCeSBraWNrcyBpbiBhbmQgdGhlIGRvbSBpc24ndCBjaGFuZ2VkXG4gICAgICAgICAgZXhpc3RpbmdDb2x1bW5FdmVudC5ldmVudCA9IG9yaWdpbmFsRXZlbnQ7XG4gICAgICAgICAgZXhpc3RpbmdDb2x1bW5FdmVudFsndGVtcEV2ZW50J10gPSBhZGp1c3RlZEV2ZW50O1xuICAgICAgICAgIGlmICghc25hcERyYWdnZWRFdmVudHMpIHtcbiAgICAgICAgICAgIGV4aXN0aW5nQ29sdW1uRXZlbnQuaGVpZ2h0ID0gMDtcbiAgICAgICAgICAgIGV4aXN0aW5nQ29sdW1uRXZlbnQud2lkdGggPSAwO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBhZGQgYSBkdW1teSBldmVudCB0byB0aGUgZHJvcCBzbyBpZiB0aGUgZXZlbnQgd2FzIHJlbW92ZWQgZnJvbSB0aGUgb3JpZ2luYWwgY29sdW1uIHRoZSBkcmFnIGRvZXNuJ3QgZW5kIGVhcmx5XG4gICAgICAgICAgY29uc3QgZXZlbnQgPSB7XG4gICAgICAgICAgICBldmVudDogb3JpZ2luYWxFdmVudCxcbiAgICAgICAgICAgIGxlZnQ6IDAsXG4gICAgICAgICAgICB0b3A6IDAsXG4gICAgICAgICAgICBoZWlnaHQ6IDAsXG4gICAgICAgICAgICB3aWR0aDogMCxcbiAgICAgICAgICAgIHN0YXJ0c0JlZm9yZURheTogZmFsc2UsXG4gICAgICAgICAgICBlbmRzQWZ0ZXJEYXk6IGZhbHNlLFxuICAgICAgICAgICAgdGVtcEV2ZW50OiBhZGp1c3RlZEV2ZW50LFxuICAgICAgICAgIH07XG4gICAgICAgICAgY29sdW1uLmV2ZW50cy5wdXNoKGV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgYWRqdXN0ZWRFdmVudHMuY2xlYXIoKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBnZXRUaW1lRXZlbnRSZXNpemVkRGF0ZXMoXG4gICAgY2FsZW5kYXJFdmVudDogQ2FsZW5kYXJFdmVudCxcbiAgICByZXNpemVFdmVudDogUmVzaXplRXZlbnRcbiAgKSB7XG4gICAgY29uc3QgbmV3RXZlbnREYXRlcyA9IHtcbiAgICAgIHN0YXJ0OiBjYWxlbmRhckV2ZW50LnN0YXJ0LFxuICAgICAgZW5kOiBnZXREZWZhdWx0RXZlbnRFbmQoXG4gICAgICAgIHRoaXMuZGF0ZUFkYXB0ZXIsXG4gICAgICAgIGNhbGVuZGFyRXZlbnQsXG4gICAgICAgIHRoaXMubWluaW11bUV2ZW50SGVpZ2h0XG4gICAgICApLFxuICAgIH07XG4gICAgY29uc3QgeyBlbmQsIC4uLmV2ZW50V2l0aG91dEVuZCB9ID0gY2FsZW5kYXJFdmVudDtcbiAgICBjb25zdCBzbWFsbGVzdFJlc2l6ZXMgPSB7XG4gICAgICBzdGFydDogdGhpcy5kYXRlQWRhcHRlci5hZGRNaW51dGVzKFxuICAgICAgICBuZXdFdmVudERhdGVzLmVuZCxcbiAgICAgICAgdGhpcy5taW5pbXVtRXZlbnRIZWlnaHQgKiAtMVxuICAgICAgKSxcbiAgICAgIGVuZDogZ2V0RGVmYXVsdEV2ZW50RW5kKFxuICAgICAgICB0aGlzLmRhdGVBZGFwdGVyLFxuICAgICAgICBldmVudFdpdGhvdXRFbmQsXG4gICAgICAgIHRoaXMubWluaW11bUV2ZW50SGVpZ2h0XG4gICAgICApLFxuICAgIH07XG5cbiAgICBjb25zdCBtb2RpZmllciA9IHRoaXMucnRsID8gLTEgOiAxO1xuXG4gICAgaWYgKHR5cGVvZiByZXNpemVFdmVudC5lZGdlcy5sZWZ0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgY29uc3QgZGF5c0RpZmYgPVxuICAgICAgICBNYXRoLnJvdW5kKCtyZXNpemVFdmVudC5lZGdlcy5sZWZ0IC8gdGhpcy5kYXlDb2x1bW5XaWR0aCkgKiBtb2RpZmllcjtcbiAgICAgIGNvbnN0IG5ld1N0YXJ0ID0gYWRkRGF5c1dpdGhFeGNsdXNpb25zKFxuICAgICAgICB0aGlzLmRhdGVBZGFwdGVyLFxuICAgICAgICBuZXdFdmVudERhdGVzLnN0YXJ0LFxuICAgICAgICBkYXlzRGlmZixcbiAgICAgICAgdGhpcy5leGNsdWRlRGF5c1xuICAgICAgKTtcbiAgICAgIGlmIChuZXdTdGFydCA8IHNtYWxsZXN0UmVzaXplcy5zdGFydCkge1xuICAgICAgICBuZXdFdmVudERhdGVzLnN0YXJ0ID0gbmV3U3RhcnQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZXdFdmVudERhdGVzLnN0YXJ0ID0gc21hbGxlc3RSZXNpemVzLnN0YXJ0O1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIHJlc2l6ZUV2ZW50LmVkZ2VzLnJpZ2h0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgY29uc3QgZGF5c0RpZmYgPVxuICAgICAgICBNYXRoLnJvdW5kKCtyZXNpemVFdmVudC5lZGdlcy5yaWdodCAvIHRoaXMuZGF5Q29sdW1uV2lkdGgpICogbW9kaWZpZXI7XG4gICAgICBjb25zdCBuZXdFbmQgPSBhZGREYXlzV2l0aEV4Y2x1c2lvbnMoXG4gICAgICAgIHRoaXMuZGF0ZUFkYXB0ZXIsXG4gICAgICAgIG5ld0V2ZW50RGF0ZXMuZW5kLFxuICAgICAgICBkYXlzRGlmZixcbiAgICAgICAgdGhpcy5leGNsdWRlRGF5c1xuICAgICAgKTtcbiAgICAgIGlmIChuZXdFbmQgPiBzbWFsbGVzdFJlc2l6ZXMuZW5kKSB7XG4gICAgICAgIG5ld0V2ZW50RGF0ZXMuZW5kID0gbmV3RW5kO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmV3RXZlbnREYXRlcy5lbmQgPSBzbWFsbGVzdFJlc2l6ZXMuZW5kO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgcmVzaXplRXZlbnQuZWRnZXMudG9wICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgY29uc3QgbWludXRlc01vdmVkID0gZ2V0TWludXRlc01vdmVkKFxuICAgICAgICByZXNpemVFdmVudC5lZGdlcy50b3AgYXMgbnVtYmVyLFxuICAgICAgICB0aGlzLmhvdXJTZWdtZW50cyxcbiAgICAgICAgdGhpcy5ob3VyU2VnbWVudEhlaWdodCxcbiAgICAgICAgdGhpcy5ldmVudFNuYXBTaXplLFxuICAgICAgICB0aGlzLmhvdXJEdXJhdGlvblxuICAgICAgKTtcbiAgICAgIGNvbnN0IG5ld1N0YXJ0ID0gdGhpcy5kYXRlQWRhcHRlci5hZGRNaW51dGVzKFxuICAgICAgICBuZXdFdmVudERhdGVzLnN0YXJ0LFxuICAgICAgICBtaW51dGVzTW92ZWRcbiAgICAgICk7XG4gICAgICBpZiAobmV3U3RhcnQgPCBzbWFsbGVzdFJlc2l6ZXMuc3RhcnQpIHtcbiAgICAgICAgbmV3RXZlbnREYXRlcy5zdGFydCA9IG5ld1N0YXJ0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmV3RXZlbnREYXRlcy5zdGFydCA9IHNtYWxsZXN0UmVzaXplcy5zdGFydDtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHR5cGVvZiByZXNpemVFdmVudC5lZGdlcy5ib3R0b20gIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICBjb25zdCBtaW51dGVzTW92ZWQgPSBnZXRNaW51dGVzTW92ZWQoXG4gICAgICAgIHJlc2l6ZUV2ZW50LmVkZ2VzLmJvdHRvbSBhcyBudW1iZXIsXG4gICAgICAgIHRoaXMuaG91clNlZ21lbnRzLFxuICAgICAgICB0aGlzLmhvdXJTZWdtZW50SGVpZ2h0LFxuICAgICAgICB0aGlzLmV2ZW50U25hcFNpemUsXG4gICAgICAgIHRoaXMuaG91ckR1cmF0aW9uXG4gICAgICApO1xuICAgICAgY29uc3QgbmV3RW5kID0gdGhpcy5kYXRlQWRhcHRlci5hZGRNaW51dGVzKFxuICAgICAgICBuZXdFdmVudERhdGVzLmVuZCxcbiAgICAgICAgbWludXRlc01vdmVkXG4gICAgICApO1xuICAgICAgaWYgKG5ld0VuZCA+IHNtYWxsZXN0UmVzaXplcy5lbmQpIHtcbiAgICAgICAgbmV3RXZlbnREYXRlcy5lbmQgPSBuZXdFbmQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZXdFdmVudERhdGVzLmVuZCA9IHNtYWxsZXN0UmVzaXplcy5lbmQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ld0V2ZW50RGF0ZXM7XG4gIH1cblxuICBwcm90ZWN0ZWQgcmVzaXplU3RhcnRlZChcbiAgICBldmVudHNDb250YWluZXI6IEhUTUxFbGVtZW50LFxuICAgIGV2ZW50OiBXZWVrVmlld1RpbWVFdmVudCB8IFdlZWtWaWV3QWxsRGF5RXZlbnQsXG4gICAgZGF5V2lkdGg/OiBudW1iZXJcbiAgKSB7XG4gICAgdGhpcy5kYXlDb2x1bW5XaWR0aCA9IHRoaXMuZ2V0RGF5Q29sdW1uV2lkdGgoZXZlbnRzQ29udGFpbmVyKTtcbiAgICBjb25zdCByZXNpemVIZWxwZXIgPSBuZXcgQ2FsZW5kYXJSZXNpemVIZWxwZXIoXG4gICAgICBldmVudHNDb250YWluZXIsXG4gICAgICBkYXlXaWR0aCxcbiAgICAgIHRoaXMucnRsXG4gICAgKTtcbiAgICB0aGlzLnZhbGlkYXRlUmVzaXplID0gKHsgcmVjdGFuZ2xlLCBlZGdlcyB9KSA9PiB7XG4gICAgICBjb25zdCBpc1dpdGhpbkJvdW5kYXJ5ID0gcmVzaXplSGVscGVyLnZhbGlkYXRlUmVzaXplKHtcbiAgICAgICAgcmVjdGFuZ2xlOiB7IC4uLnJlY3RhbmdsZSB9LFxuICAgICAgICBlZGdlcyxcbiAgICAgIH0pO1xuXG4gICAgICBpZiAoaXNXaXRoaW5Cb3VuZGFyeSAmJiB0aGlzLnZhbGlkYXRlRXZlbnRUaW1lc0NoYW5nZWQpIHtcbiAgICAgICAgbGV0IG5ld0V2ZW50RGF0ZXM7XG4gICAgICAgIGlmICghZGF5V2lkdGgpIHtcbiAgICAgICAgICBuZXdFdmVudERhdGVzID0gdGhpcy5nZXRUaW1lRXZlbnRSZXNpemVkRGF0ZXMoZXZlbnQuZXZlbnQsIHtcbiAgICAgICAgICAgIHJlY3RhbmdsZSxcbiAgICAgICAgICAgIGVkZ2VzLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IG1vZGlmaWVyID0gdGhpcy5ydGwgPyAtMSA6IDE7XG4gICAgICAgICAgaWYgKHR5cGVvZiBlZGdlcy5sZWZ0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgY29uc3QgZGlmZiA9IE1hdGgucm91bmQoK2VkZ2VzLmxlZnQgLyBkYXlXaWR0aCkgKiBtb2RpZmllcjtcbiAgICAgICAgICAgIG5ld0V2ZW50RGF0ZXMgPSB0aGlzLmdldEFsbERheUV2ZW50UmVzaXplZERhdGVzKFxuICAgICAgICAgICAgICBldmVudC5ldmVudCxcbiAgICAgICAgICAgICAgZGlmZixcbiAgICAgICAgICAgICAgIXRoaXMucnRsXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBkaWZmID0gTWF0aC5yb3VuZCgrZWRnZXMucmlnaHQgLyBkYXlXaWR0aCkgKiBtb2RpZmllcjtcbiAgICAgICAgICAgIG5ld0V2ZW50RGF0ZXMgPSB0aGlzLmdldEFsbERheUV2ZW50UmVzaXplZERhdGVzKFxuICAgICAgICAgICAgICBldmVudC5ldmVudCxcbiAgICAgICAgICAgICAgZGlmZixcbiAgICAgICAgICAgICAgdGhpcy5ydGxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLnZhbGlkYXRlRXZlbnRUaW1lc0NoYW5nZWQoe1xuICAgICAgICAgIHR5cGU6IENhbGVuZGFyRXZlbnRUaW1lc0NoYW5nZWRFdmVudFR5cGUuUmVzaXplLFxuICAgICAgICAgIGV2ZW50OiBldmVudC5ldmVudCxcbiAgICAgICAgICBuZXdTdGFydDogbmV3RXZlbnREYXRlcy5zdGFydCxcbiAgICAgICAgICBuZXdFbmQ6IG5ld0V2ZW50RGF0ZXMuZW5kLFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGlzV2l0aGluQm91bmRhcnk7XG4gICAgfTtcbiAgICB0aGlzLmNkci5tYXJrRm9yQ2hlY2soKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaGlkZGVuXG4gICAqL1xuICBwcm90ZWN0ZWQgZ2V0QWxsRGF5RXZlbnRSZXNpemVkRGF0ZXMoXG4gICAgZXZlbnQ6IENhbGVuZGFyRXZlbnQsXG4gICAgZGF5c0RpZmY6IG51bWJlcixcbiAgICBiZWZvcmVTdGFydDogYm9vbGVhblxuICApIHtcbiAgICBsZXQgc3RhcnQ6IERhdGUgPSBldmVudC5zdGFydDtcbiAgICBsZXQgZW5kOiBEYXRlID0gZXZlbnQuZW5kIHx8IGV2ZW50LnN0YXJ0O1xuICAgIGlmIChiZWZvcmVTdGFydCkge1xuICAgICAgc3RhcnQgPSBhZGREYXlzV2l0aEV4Y2x1c2lvbnMoXG4gICAgICAgIHRoaXMuZGF0ZUFkYXB0ZXIsXG4gICAgICAgIHN0YXJ0LFxuICAgICAgICBkYXlzRGlmZixcbiAgICAgICAgdGhpcy5leGNsdWRlRGF5c1xuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZW5kID0gYWRkRGF5c1dpdGhFeGNsdXNpb25zKFxuICAgICAgICB0aGlzLmRhdGVBZGFwdGVyLFxuICAgICAgICBlbmQsXG4gICAgICAgIGRheXNEaWZmLFxuICAgICAgICB0aGlzLmV4Y2x1ZGVEYXlzXG4gICAgICApO1xuICAgIH1cblxuICAgIHJldHVybiB7IHN0YXJ0LCBlbmQgfTtcbiAgfVxufVxuIl19