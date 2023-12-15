import { JsPsych, JsPsychPlugin, ParameterType, TrialType } from "jspsych";
import React from "react";
import { createRoot } from "react-dom/client";

const info = {
    name: "self-paced-reading-plugin",
    parameters: {
        textline: {
            type: ParameterType.OBJECT
        },
        delimiter: {
            type: ParameterType.STRING
        },
        concealer: {
            type: ParameterType.STRING
        }
    }
} as const;

type Info = typeof info;

type DisplayType = "normal" | "shown" | "hidden";
type TextLine = Array<string | [string, DisplayType]>;
type Delimiter = string;
type Concealer = "underline" | "dash";

/**
 * **self-paced-reading**
 *
 * jsPsych plugin for self-paced reading experiment task with moving window
 */
class SelfPacedReadingPlugin implements JsPsychPlugin<Info> {
    static info = info;
    constructor(private jsPsych: JsPsych) {}

    trial(display_element: HTMLElement, trial: TrialType<Info>) {
        const root = createRoot(display_element);
        const textLineSegmentSpan = (s: TextLine[0]) => {
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
        root.render([] /* 20231213 備忘: ここに <span></span> みたいなのの配列を指定できる */);
    }
}
