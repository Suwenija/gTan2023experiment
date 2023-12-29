/**
    * @title 実験用ページ
    * @description mesures the immediate costs to shuttle between inyaku words and homophonic loanwords.
    * @version 0.1.0
    *
    * @assets assets/
*/

// You can import stylesheets (.scss or .css).
import "../styles/main.scss";

import FullscreenPlugin from "@jspsych/plugin-fullscreen";
import HtmlButtonResponsePlugin from "@jspsych/plugin-html-button-response";
import SurveyHtmlFormPlugin from "@jspsych/plugin-survey-html-form";
import { initJsPsych } from "jspsych";
import React, { ReactComponentElement, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";

/**
    * This function will be executed by jsPsych Builder and is expected to run the jsPsych experiment
    *
    * @type {import("jspsych-builder").RunFunction}
*/
export async function run({ assetPaths, input = {}, environment, title, version }) {
    const jsPsych = initJsPsych();

    let timeline: any[] = [];

    // Welcoming phase
    timeline.push({
        type: HtmlButtonResponsePlugin,
        stimulus: renderToString(
            <div>
                <p>実験にご協力いただきありがとうございます。</p>
                <p>ボタンを押して先へお進みください。</p>
            </div>
        ),
        choices: ["先へ進む"]
    })
    timeline.push({
        type: HtmlButtonResponsePlugin,
        stimulus: renderToString(
            <div>
                <p>実験に際して、以下のことに同意いただける場合は、ボタンを押して先にお進みください。</p>
                <ul className="text-left">
                    <li>本実験は、横浜翠嵐高校 G探究 2年 言語学班が行っております。</li>
                    <li>得たデータは、研究成果の一部として発表される可能性があります。</li>
                    <li>個人情報は収集しません。（実験者の意図によらず入力された場合でも、無関係の第三者に公開することはありません。）</li>
                </ul>
            </div>
        ),
        choices: ["同意する"]
    })

    // Switch to fullscreen
    timeline.push({
        type: FullscreenPlugin,
        fullscreen_mode: true,
        message: renderToString(
            <p>全画面表示になります。</p>
        ),
        button_label: "OK"
    });

    // The main phase of the experiment here

    // Metadata survey
    const gradeRadioInput = (num: string) => {
        const id = "grade-" + num + "th";
        return <>
            <input type="radio" id={id} name="grade" value={num + "th"} required />
            <label htmlFor={id}>翠嵐 {num} 期生</label>
        </>
    }
    const radioAnotherInput =
        (nameName: string, placeholder: string, label = "その他", subInputSuffix = "", freeInputType: "text" | "number" = "text") => {
            const [freeInputDisabled, setFreeInputDisabled] = useState(true);
            const [freeInputRequired, setFreeInputRequired] = useState(false);
            const freeInput =
                <input type={freeInputType} id={nameName+"-free"} name={nameName+"-free"} placeholder={placeholder} disabled={freeInputDisabled} required={freeInputRequired} />;
            const toggleFree = (checked: boolean) => {
                setFreeInputDisabled(!checked);
                setFreeInputRequired(checked);
            }
            const id = nameName+"-another";
            const res =
                <>
                    <input type="radio" id={id} name={nameName} value="another" onChange={(e) => toggleFree(e.target.checked)} required />
                    <label htmlFor={id}>{label}:</label>
                    <span className="q-free">{freeInput}{subInputSuffix}</span>
                </>
            return res;
        };
    timeline.push({
        type: SurveyHtmlFormPlugin,
        html: renderToString(
            <div id="survey-root"></div>
        ),
        button_label: "送信する",
        on_load: () => {
            const rootDiv = document.getElementById("survey-root");
            if (rootDiv === null) {
                throw "Fatal internal error: root div not found.";
            }
            const root = createRoot(rootDiv);
            root.render(
                <>
                    <p>最後にアンケートにご協力ください：</p>
                    <fieldset id="q-grade">
                        <legend>Q1. あなたが当てはまるものをお選びください。</legend>
                        {gradeRadioInput("76")}
                        {gradeRadioInput("77")}
                        {gradeRadioInput("78")}
                        {radioAnotherInput("grade", "所属等")}
                    </fieldset>
                    <fieldset id="q-mother-tongue">
                        <legend>Q2. あなたの母語は？</legend>
                        <input type="radio" id="mother-tongue-ja" name="mother-tongue" value="ja" required />
                        <label htmlFor="mother-tongue-ja">日本語</label>
                        {radioAnotherInput("mother-tongue", "○○語")}
                    </fieldset>
                    <fieldset id="q-is-first">
                        <legend>Q3. 今回参加されたのは初めてですか？</legend>
                        <input type="radio" id="is-first-yes" name="is-first" value="first" required />
                        <label htmlFor="is-first-yes">初めて</label>
                        {radioAnotherInput("is-first", "2", "2 回目以上", " 回目", "number")}
                    </fieldset>
                </>
            )
        }
    });

    await jsPsych.run(timeline);

    // Return the jsPsych instance so jsPsych Builder can access the experiment results (remove this
    // if you handle results yourself, be it here or in `on_finish()`)
    return jsPsych;
}
