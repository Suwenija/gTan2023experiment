import { JsPsych, JsPsychPlugin, ParameterType, TrialType } from "jspsych";
import React from "react";
import { createRoot } from "react-dom/client";

const validDisplayTypes = ["normal", "shown", "hidden"] as const;
type DisplayType = typeof validDisplayTypes[number];
function isValidDisplayType(obj): obj is typeof validDisplayTypes[number] {
    for (let e of validDisplayTypes) {
        if (obj === e) {
            return true;
        }
    }
    return false;
}

const validConcealers = ["underline", "dash"] as const;
const defaultConcealer = validConcealers[0];
type Concealer = typeof validConcealers[number];
type DefaultConcealer = typeof defaultConcealer;
function isValidConcealer(obj): obj is typeof validConcealers[number] {
    for (let e of validConcealers) {
        if (obj === e) {
            return true;
        }
    }
    return false;
}

type Textline = Array<string | [string, DisplayType]>;
function isValidTextline(obj): obj is Textline {
    if (!Array.isArray(obj)) {
        return false;
    }
    return obj.every(e => {
        if (typeof e === "string") {
            return true;
        }
        if (Array.isArray(e)) {
            if (e.length === 2 && typeof e[0] === "string" && isValidDisplayType(e[1])) {
            } else {
                return false;
            }
        }
        return false;
    })
}

const info = {
    name: "self-paced-reading-plugin",
    parameters: {
        textline: {
            type: ParameterType.OBJECT,
        },
        concealer: {
            type: ParameterType.STRING,
            default: defaultConcealer
        }
    }
} as const;

type Info = typeof info;

const classNameTextlineSegmentDefault = "textline-segment";
const classNameTextlineSegmentRevealed = "textline-segment-revealed";
const classNameTextlineSegmentShown = "textline-segment-shown";
const classNameTextlineSegmentHidden = "textline-segment-hidden";

type ClassNameTextlineSegment =
    typeof classNameTextlineSegmentDefault |
    typeof classNameTextlineSegmentRevealed |
    typeof classNameTextlineSegmentShown |
    typeof classNameTextlineSegmentHidden;

type TrialData = {
    textline: Array<{
        text: string,
        displayType: DisplayType,
        duration: number
    }>
}

/**
 * **self-paced-reading**
 *
 * jsPsych plugin for self-paced reading experiment task with moving window
 */
export class SelfPacedReadingPlugin implements JsPsychPlugin<Info> {
    static info = info;
    constructor(private jsPsych: JsPsych) {}

    trial(display_element: HTMLElement, trial: TrialType<Info>) {
        // initialize the DOM below:
        if (!isValidTextline(trial.textline)) {
            throw("SPR: parameter textline is not valid");
        }
        const root = createRoot(display_element);
        const concealer = (
            () => {
                if (isValidConcealer(trial.concealer)) {
                    return trial.concealer;
                }
                return defaultConcealer;
            }
        )();
        const sprRootClassName = [
            "spr-root",
            "spr-root-concealer-" + concealer
        ] as const;
        const textlineSegments = trial.textline.map(
            (s: Textline[0]) => {
                const text: string = (typeof s === "string") ? s : s[0];
                const displayType: DisplayType = (typeof s === "string") ? "normal" : s[1];
                switch (displayType) {
                    case "normal":
                        return <span className={classNameTextlineSegmentDefault} data-displayText={text}></span>;
                    case "shown":
                        return <span className={classNameTextlineSegmentShown} data-displayText={text}></span>;
                    case "hidden":
                        return <span className={classNameTextlineSegmentHidden} data-displayText={text}></span>;
                }
            }
        );
        root.render(
            <div className={sprRootClassName.join(" ")}>
                {textlineSegments}
                <div className="doc">スペースキーで進みます</div>
            </div>
        );

        // trial below:
        const currentIndex: [number] = [-1];
        const timeHolder: [Date] = [new Date()];
        const durationLog: (number | undefined)[] = []; // milliseconds
        this.jsPsych.pluginAPI.getKeyboardResponse({
            callback_function: () => {proceedTextline(textlineSegments, currentIndex, timeHolder, durationLog)},
            valid_responses: [' '],
            persist: false
        });
        const proceedTextline = (textlineSegments: React.JSX.Element[], currentIndex: [number], timeHolder: [Date], durationLog: (number | undefined)[]) => {
            const currentTime = new Date();
            const current = textlineSegments[currentIndex[0]];
            if (current !== undefined) {
                current.props.className = classNameTextlineSegmentDefault;
                durationLog.push(currentTime.getTime() - timeHolder[0].getTime());
            }
            while (true) {
                currentIndex[0]++;
                if (currentIndex[0] >= textlineSegments.length) {
                    finishTrial(durationLog);
                    return;
                }
                const current = textlineSegments[currentIndex[0]];
                if (current.props.className === classNameTextlineSegmentDefault) {
                    timeHolder[0] = new Date();
                    current.props.className = classNameTextlineSegmentRevealed;
                    break;
                }
                durationLog.push(undefined);
            }
        };
        const finishTrial = (durationLog) => {
            if (!isValidTextline(trial.textline)) {
                throw("Fatal internal error.");
            }
            const data: TrialData = {
                textline: []
            };
            let i = 0;
            while (true) {
                const textlineSegment = trial.textline[i];
                const [text, displayType]: [string, DisplayType] =
                    typeof textlineSegment == "string" ?
                    [textlineSegment, "normal"] :
                    textlineSegment;
                data.textline.push({
                    text: text,
                    displayType: displayType,
                    duration: durationLog[i]
                })
                i++;
                if (i >= trial.textline.length && i >= durationLog.length) {
                    break;
                }
            }
            this.jsPsych.finishTrial(data);
        };
    }
}
