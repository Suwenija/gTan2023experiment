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
import React from "react";
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
        choises: ["先へ進む"]
    })
    timeline.push({
        type: HtmlButtonResponsePlugin,
        stimulus: renderToString(
            <div>
                <p>実験に際して、以下のことに同意いただける場合は、ボタンを押して先にお進みください。</p>
                <ul>
                    <li>本実験は、横浜翠嵐高校 G探究 2年 言語学班が行っております。</li>
                    <li>得たデータは、研究成果の一部として発表される可能性があります。</li>
                    <li>個人情報は収集しません。また、実験者の意図によらず個人情報が入力された場合でも、それを無関係の第三者に公開することはありません。</li>
                </ul>
            </div>
        ),
        choises: ["同意する"]
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
        return <input type="radio" required id={"grade-" + num + "th"} name="grade" value={num + "th"}>翠嵐 {num} 期生</input>
    }
    const radioAnotherInput =
        (nameName: string, placeholder: string, label = "その他", subInputSuffix = "", freeInputType: "text" | "number" = "text") => {
            const freeInput =
                <input disabled type={freeInputType} id={nameName+"-free"} name={nameName+"-free"} placeholder={placeholder}></input>;
            const toggleFree = (checked: boolean) => {
                freeInput.props.disabled = !checked;
                freeInput.props.required = checked;
            }
            const res =
                <input type="radio" id={nameName+"-another"} name={nameName} value="another" onChange={() => toggleFree(this.checked)}>
                    {label}:
                    <span className="q-free">
                        {freeInput}{subInputSuffix}
                    </span>
                </input>;
            return res;
        };
    timeline.push({
        type: SurveyHtmlFormPlugin,
        stimulus: renderToString(
            <div>
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
                    <input type="radio" id="mother-tongue-ja" name="mother-tongue" value="ja">日本語</input>
                    {radioAnotherInput("mother-tongue", "○○語")}
                </fieldset>
                <fieldset id="q-is-first">
                    <legend>Q3. 今回参加されたのは初めてですか？</legend>
                    <input type="radio" id="is-first" name="is-first" value="first">初めて</input>
                    {radioAnotherInput("is-first", "2", "2 回目以上", " 回目", "number")}
                </fieldset>
            </div>
        ),
    });

    await jsPsych.run(timeline);

    // Return the jsPsych instance so jsPsych Builder can access the experiment results (remove this
    // if you handle results yourself, be it here or in `on_finish()`)
    return jsPsych;
}
