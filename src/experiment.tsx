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
import { SelfPacedReadingPlugin } from "./selfPacedReadingPlugin";
import { initJsPsych } from "jspsych";
import React, { DOMElement, FC, useRef, useState } from "react";
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
                <ul className="welcoming-notes">
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
    const GradeOption: FC<{num: string}> = ({num}) => {
        return <option value={num + "th"}>翠嵐 {num} 期生</option>
    }
    const SelectWithFreeInput: FC<{
        children?,
        nameName: string,
        placeholder?: string,
        freeInputPlaceholder?: string,
        freeInputValue?: string,
        label?: string,
        freeInputSuffix?: string,
        freeInputType?: "text" | "number"
    }> = ({children, nameName, placeholder = "--選択--", freeInputPlaceholder, freeInputValue, label = "その他", freeInputSuffix = "", freeInputType = "text"}) => {
        const valueFree = "FREE_DESCRIPTION";
        let [freeInputDisabled, setFreeInputDisabled] = useState(true);
        let [freeInputRequired, setFreeInputRequired] = useState(false);
        const toggleFree = async (value: string) => {
            await setFreeInputDisabled(!(value === valueFree));
            await setFreeInputRequired(value === valueFree);
            if (value === valueFree) {
                document.getElementById(nameName+"-free")?.focus();
            }
        };
        const res =
            <>
                <select name={nameName} onChange={(e) => toggleFree(e.target.value)} required>
                    <option value="" hidden>{placeholder}</option>
                    {children}
                    <option value={valueFree}>{label}</option>
                </select>
                <div className="q-free">
                    自由記述：
                    <input type={freeInputType} id={nameName+"-free"} name={nameName+"-free"} value={freeInputValue} placeholder={freeInputPlaceholder} disabled={freeInputDisabled} required={freeInputRequired} />
                    {freeInputSuffix}
                </div>
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
                        <SelectWithFreeInput nameName="grade" freeInputPlaceholder="所属等">
                            <GradeOption num="76"/>
                            <GradeOption num="77"/>
                            <GradeOption num="78"/>
                        </SelectWithFreeInput>
                    </fieldset>
                    <fieldset id="q-mother-tongue">
                        <legend>Q2. あなたの母語は？</legend>
                        <SelectWithFreeInput nameName="mother-tongue" freeInputPlaceholder="○○語">
                            <option value="ja">日本語</option>
                        </SelectWithFreeInput>
                    </fieldset>
                    <fieldset id="q-is-first">
                        <legend>Q3. 今回参加されたのは初めてですか？</legend>
                        <SelectWithFreeInput nameName="is-first" freeInputValue="2" label="2 回目以上" freeInputSuffix=" 回目" freeInputType="number">
                            <option value="first">初めて</option>
                        </SelectWithFreeInput>
                    </fieldset>
                </>
            )
        }
    });

    timeline.push({
        type: SelfPacedReadingPlugin,
        textline: [
            "いつの",
            "世も、",
            "イデオロギーによる",
            "対立は",
            "社会に",
            "分断を",
            "引き起こす",
            "一つの",
            "原因と",
            "なっている。",
            "冷戦期において",
            "資本主義と",
            "社会主義の",
            "両陣営を",
            "隔てた",
            "溝は、",
            "その",
            "最たる",
            "例だと",
            "いえるだろう。",
            "為道論を",
            "めぐる",
            "大小",
            "さまざまな",
            "闘争に",
            "直面したとき、",
            "いま",
            "我々には",
            "何が",
            "できるのだろうか。",
        ]
    })
    await jsPsych.run(timeline);

    // Return the jsPsych instance so jsPsych Builder can access the experiment results (remove this
    // if you handle results yourself, be it here or in `on_finish()`)
    return jsPsych;
}
