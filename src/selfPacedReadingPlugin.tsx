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

type TextLine = Array<string | [string, DisplayType]>;
function isValidTextLine(obj): obj is TextLine {
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
        if (!isValidTextLine(trial.textline)) {
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
        const sprRootClasses = [
            "spr-root",
            "spr-root-concealer-" + concealer
        ] as const;
        const textLineSegments = trial.textline.map(
            (s: TextLine[0]) => {
                const text: string = (typeof s === "string") ? s : s[0];
                const displayType: DisplayType = (typeof s === "string") ? "normal" : s[1];
                switch (displayType) {
                    case "normal":
                        return <span className="textline-segment" data-displayText={text}></span>;
                    case "shown":
                        return <span className="textline-segment-shown" data-displayText={text}></span>;
                    case "hidden":
                        return <span className="textline-segment-hidden" data-displayText={text}></span>;
                }
            }
        );
        root.render(
            <div className={sprRootClasses.join(" ")}>
                {textLineSegments}
            </div>
        );

        // trial below:
        
    }
}
