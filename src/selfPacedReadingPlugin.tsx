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

type TextLine = Array<string | [string, "normal" | "shown" | "hidden"]>;
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
        root.render([] /* 20231213 備忘: ここに <span></span> みたいなのの配列を指定できる */);
    }
}
