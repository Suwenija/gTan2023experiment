import { JsPsych, JsPsychPlugin, ParameterType, TrialType } from "jspsych";
import React, { FC, useState } from "react";
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
                return true;
            } else {
                return false;
            }
        }
    })
}

const info = {
    name: "self-paced-reading-plugin",
    parameters: {
        textline: {
            type: ParameterType.OBJECT,
            require: true,
        },
        concealer: {
            type: ParameterType.STRING,
            default: defaultConcealer
        }
    }
} as const;

type Info = typeof info;

const classNameTextlineSegmentNormal = "textline-segment";
const classNameTextlineSegmentShown = "textline-segment-shown";
const classNameTextlineSegmentHidden = "textline-segment-hidden";

type ClassNameTextlineSegment =
    typeof classNameTextlineSegmentNormal |
    typeof classNameTextlineSegmentShown |
    typeof classNameTextlineSegmentHidden;

type TrialData = {
    textline: Array<{
        text: string,
        displayType: DisplayType,
        index: number | null,
        duration: number | null,
    }>
}

const SPRDiv: FC<{
    trial: TrialType<Info>,
    timeHolder: [Date] | [],
    durationLog: number[],
    finishTrial: (any) => void
}> = ({trial, timeHolder, durationLog, finishTrial}) => {
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
    ] as const;

    const [windowPosition, setWindowPosition] = useState(-1);
    let i = 0;
    if (!isValidTextline(trial.textline)) {
        throw("textline is not valid.");
    }
    const textlineSegments = trial.textline.map(
        (s: Textline[0]) => {
            const text: string = (typeof s === "string") ? s : s[0];
            const displayType: DisplayType = (typeof s === "string") ? "normal" : s[1];
            switch (displayType) {
                case "normal": {
                    const res =  <span className={classNameTextlineSegmentNormal} data-concealer={concealer} data-revealed={windowPosition === i} data-displayText={text}></span>;
                    i++;
                    return res;
                }
                case "shown": {
                    return <span className={classNameTextlineSegmentShown} data-displayText={text}></span>;
                }
                case "hidden": {
                    return <span className={classNameTextlineSegmentHidden} data-concealer={concealer} data-displayText={text}></span>;
                }
            }
        }
    );
    const numOfNormalSegment = i;
    
    const proceedTextline = (timeHolder: [Date] | [], durationLog: (number | undefined)[]) => {
        setWindowPosition(current => {
            const currentTime = new Date();
            if (timeHolder[0] !== undefined) {
                durationLog.push(currentTime.getTime() - timeHolder[0].getTime());
            }
            timeHolder[0] = currentTime;
            if (current+1 > numOfNormalSegment) {
                finishTrial(durationLog);
            }
            return current+1;
        })
    };
    const triggerButton = <input id="spr-trigger" className="spr-trigger" type="button" value="ボタン" onClick={() => proceedTextline(timeHolder, durationLog)}/>
    return (
        <div className={sprRootClassName.join(" ")} data-windowPosition={windowPosition}>
            <div className="spr-doc">スペースキーまたは下のボタンで進みます</div>
            <div className="spr-textline">
                {textlineSegments}
            </div>
            {triggerButton}
        </div>
    );
};

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

        const finishTrial = (durationLog) => {
            console.log(durationLog)
            if (!isValidTextline(trial.textline)) {
                throw("Fatal internal error.");
            }
            const data: TrialData = {
                textline: []
            };
            let i = 0;
            for (const textlineSegment of trial.textline) {
                const [text, displayType]: [string, DisplayType] =
                    typeof textlineSegment == "string" ?
                    [textlineSegment, "normal"] :
                    textlineSegment;
                if (displayType == "normal") {
                    data.textline.push({
                        text: text,
                        displayType: displayType,
                        index: i,
                        duration: durationLog[i]
                    });
                    i++;
                } else {
                    data.textline.push({
                        text: text,
                        displayType: displayType,
                        index: null,
                        duration: null
                    });
                }
            }
            this.jsPsych.finishTrial(data);
        };
        
        const timeHolder: [Date] | [] = [];
        const durationLog: number[] = []; // milliseconds
        root.render(<SPRDiv trial={trial} timeHolder={timeHolder} durationLog={durationLog} finishTrial={finishTrial}></SPRDiv>);
        const keyBoardBind = () => {
            this.jsPsych.pluginAPI.getKeyboardResponse({
                callback_function: () => {
                    document.getElementById('spr-trigger')?.click();
                    keyBoardBind();
                },
                valid_responses: [' '],
                persist: false
            });
        }
        keyBoardBind();
    }
}
