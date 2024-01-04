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
import { SendToGoogleFormPlugin } from "./sendToGoogleFormPlugin";
import { initJsPsych } from "jspsych";
import React, { FC, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { inyakuRandomTimeline } from "./inyakuRandomTimeline";

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
    });
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
    });

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
    const GradeOption: FC<{ num: string }> = ({ num }) => {
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
    }> = ({ children, nameName, placeholder = "--選択--", freeInputPlaceholder, freeInputValue, label = "その他", freeInputSuffix = "", freeInputType = "text" }) => {
        const valueFree = "FREE_DESCRIPTION";
        let [freeInputDisabled, setFreeInputDisabled] = useState(true);
        let [freeInputRequired, setFreeInputRequired] = useState(false);
        const toggleFree = async (value: string) => {
            await setFreeInputDisabled(!(value === valueFree));
            await setFreeInputRequired(value === valueFree);
            if (value === valueFree) {
                document.getElementById(nameName + "-free")?.focus();
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
                    <input type={freeInputType} id={nameName + "-free"} name={nameName + "-free"} value={freeInputValue} placeholder={freeInputPlaceholder} disabled={freeInputDisabled} required={freeInputRequired} />
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
                    <p>はじめにアンケートにご協力ください：</p>
                    <fieldset id="q-grade">
                        <legend>Q1. あなたが当てはまるものをお選びください。</legend>
                        <SelectWithFreeInput nameName="grade" freeInputPlaceholder="所属等">
                            <GradeOption num="76" />
                            <GradeOption num="77" />
                            <GradeOption num="78" />
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

    const [inyakuTimeline, minorTranslations] = inyakuRandomTimeline([
        {
            mainReplacer: "イデオロギー",
            subReplacer: [
                ["観念形態", null],
                ["為道論", "イドウロン"],
            ],
            explanation: "その人またはある集団の歴史的・社会的立場にもとづいて作られた、根本的な考え。",
            textline:
                "いつの|世も、|{0}に|よる|対立は|社会に|分断を|引き起こす|一つの|原因と|なって|いる。|"+
                "冷戦期に|おいて|資本主義と|社会主義の|両陣営を|隔てた|溝は、|その|最たる|例だと|いえるだろう。|"+
                "{1}を|めぐる|大小|さまざまな|闘争に|直面した|とき、|いま|我々には|何が|できるのだろうか。"
        },
        {
            mainReplacer: "コントロール",
            subReplacer: [
                ["制御", null],
                ["管統", "カントウ"],
            ],
            explanation: "起こりうる問題に気をつけ、おさえること。",
            textline:
                "日常の|さまざまな|場面で、|感情の|{0}が|必要に|なる|ことは|多い。|"+
                "たとえば|周囲の|人間や|環境に|対する|怒りの|感情は、|生きて|いく|うえで|うまく|処理したい|ところだ。|"+
                "怒りを|{1}する|その人の|手腕に、|その|人となりが|表れるという|面も|あるだろう。"
        },
        {
            mainReplacer: "サードパーティ",
            subReplacer: [
                ["第三者", null],
                ["参派", "サンパ"],
            ],
            explanation: "あるメーカーの作った電気製品などに使える部品や周辺機器を作っている、別のメーカー。",
            textline:
                "この|アプリで|使用できる|拡張機能の|なかには、|{0}に|よって|開発された|ものも|あります。|"+
                "そういった|拡張機能は、|公式の|者で|なくても|製作できるため|種類が|豊富です。|"+
                "しかし、|{1}の|製品に|特有な|セキュリティ上の|懸念が|ある|ことを|忘れては|いけません。"
        },
        {
            mainReplacer: "パラダイム",
            subReplacer: [
                ["枠組み的思想", null],
                ["範題", "ハンダイ"],
            ],
            explanation: "ある時代・社会がひろく受け入れている、基本的な考え方。",
            textline:
                "中世以前に|おいて、|ひとつの|{0}と|なって|いたのが|天動説で|あった。|"+
                "それに|一石を|投じたのが|コペルニクスらで|ある。|"+
                "彼らの|努力は|実を|結び、|ついに|{1}は|転換して|地動説の|時代が|訪れたので|あった。"
        },
        {
            mainReplacer: "ホルモン",
            subReplacer: [
                ["内分泌物質", null],
                ["放文", "ホウモン"],
            ],
            explanation: "内分泌腺から血液に分泌され、からだの活動を調整する物質。",
            textline:
                "心身の|健康の|ためには、|{0}の|バランスを|崩さない|ように|する|ことが|大切です。"+
                "これを|怠ると、|さまざまな|不調の|原因に|なりかねません。|"+
                "日々の|健やかな|暮らしの|ために、|{1}の|調子を|意識した|食事や|睡眠を|心がけて|みませんか。"
        },
        {
            mainReplacer: "ロックダウン",
            subReplacer: [
                ["都市封鎖", null],
                ["籠断", "ロウダン"],
            ],
            explanation: "ある地域で外出制限や休業・休校などを強制すること。",
            textline:
                "数年前に|始まった|感染症の|拡大の|影響で、|世界には|{0}が|行われる|地域が|多く|あった。|"+
                "その|区域から|地球規模に|ウイルスが|広がるのを|防ぐために|この|措置が|有益なのは|おそらく|間違い|ないだろう。|"+
                "ただし、|そのように|{1}を|受ける|地域の|人々に|対して、|人道的な|配慮を|常に|あわせ持って|おかなければ|ならない。"
        },
    ]);
    timeline.push(...inyakuTimeline);

    // Send data.
    timeline.push({
        type: SendToGoogleFormPlugin,
        obj: jsPsych.data.get(),
        formId: "1FAIpQLScU9J3TMn3Vuz-qCN-CWjpyGdip3qAgqYSgfgNFbivzqxAlfw", // テスト用
        entryId: "933711398", // テスト用
    })

    // Ending phase
    timeline.push({
        type: HtmlButtonResponsePlugin,
        stimulus: renderToString(
            <div className="text-left">
                <p>実験にご協力いただきありがとうございました。</p>
                <p>実験で使用した以下の言葉は、あまり普及していない訳語です。使用にはご注意ください。</p>
                <ul>
                    {
                        minorTranslations.map(([translation, translationRuby, term]) => {
                            return <li>{translation}〈{translationRuby}〉：「{term}」の訳語</li>
                        })
                    }
                </ul>
            </div>
        ),
        choices: ["先へ進む"]
    });

    await jsPsych.run(timeline);

    // Return the jsPsych instance so jsPsych Builder can access the experiment results (remove this
    // if you handle results yourself, be it here or in `on_finish()`)
    return jsPsych;
}
