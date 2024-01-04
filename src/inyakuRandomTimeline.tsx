import HtmlButtonResponsePlugin from "@jspsych/plugin-html-button-response";
import { SelfPacedReadingPlugin, Textline } from "./selfPacedReadingPlugin";
import { renderToString } from "react-dom/server";
import React from "react";

type TermSet = {
    mainReplacer: string, // カタカナ語
    subReplacer: [string, string | null][], // 訳語（と読み）
    explanation: string, // 語釈
    textline: string, // 読文。{0}, {1} はカタカナ語／訳語によって置換
};
type SubExperiment = {
    mainReplacer: string, // カタカナ語
    subReplacer: string, // ここで使用する訳語
    subReplacerRuby: string | null, // 訳語読み
    subReplacerIndex: number, // 訳語のインデックス
    explanation: string | null, // 語釈または null
    textline: Textline,
};

function randomChoise<T>(arr: T[]): [T, number] {
    const len = arr.length;
    const randomIndex = Math.floor(Math.random() * len);
    return [arr[randomIndex], randomIndex];
};
const format = (str: string, ...args: unknown[]): string => {
    for (const [i, arg] of args.entries()) {
        const regExp = new RegExp(`\\{${i}\\}`, 'g')
        str = str.replace(regExp, arg as string)
    }
    return str
};

const randomlyDetermineSubExperiment: ((TermSet) => SubExperiment) = (termSet: TermSet) => {
    const mainReplacer = termSet.mainReplacer;
    const [[subReplacer, subReplacerRuby], subReplacerIndex] = randomChoise(termSet.subReplacer);
    const explanation =
        Math.random() < 1/3 ?
        null :
        termSet.explanation;
    const textlineReplacers =
        Math.random() < .5 ?
        [mainReplacer, subReplacer] :
        [subReplacer, mainReplacer];
    const textline = format(termSet.textline, ...textlineReplacers).split("|");
    return {
        mainReplacer: mainReplacer,
        subReplacer: subReplacer,
        subReplacerRuby: subReplacerRuby,
        subReplacerIndex: subReplacerIndex,
        explanation: explanation,
        textline: textline,
    }
};
export const inyakuRandomTimeline = (termSets: TermSet[]) => {
    const subExperiments = termSets.map(randomlyDetermineSubExperiment);
    let explanations:
        [SubExperiment["mainReplacer"], SubExperiment["subReplacer"], SubExperiment["subReplacerRuby"], SubExperiment["explanation"]][]
        = [];
    let textlines: Textline[] = [];
    let minorTranslations:
        [SubExperiment["subReplacer"], SubExperiment["subReplacerRuby"], SubExperiment["mainReplacer"]][]
        = [];
    subExperiments.forEach(subExperiment => {
        if (subExperiment.explanation !== null) {
            explanations.push([subExperiment.mainReplacer, subExperiment.subReplacer, subExperiment.subReplacerRuby, subExperiment.explanation]);
        }
        textlines.push(subExperiment.textline);
        if (subExperiment.subReplacerIndex > 0) {
            minorTranslations.push([subExperiment.subReplacer, subExperiment.subReplacerRuby, subExperiment.mainReplacer]);
        }
    });

    const timeline: any[] = [];

    // 言葉の確認
    const numOfExplanations = explanations.length;
    if (numOfExplanations > 0) {
        timeline.push({
            type: HtmlButtonResponsePlugin,
            stimulus: renderToString(
                <p>はじめに、次の言葉の意味をご確認ください。</p>
            ),
            choices: ["次へ"]
        });
        let explanationsTemp = [...explanations];
        while (explanationsTemp.length > 0) {
            const [[term, translation, translationRuby, explanation], index] = randomChoise(explanationsTemp);
            timeline.push({
                type: HtmlButtonResponsePlugin,
                stimulus: renderToString(
                    <>
                        <p>
                            次の言葉の意味をご確認ください。
                            (No. {numOfExplanations - explanationsTemp.length + 1} / {numOfExplanations})
                        </p>
                        <p className="text-left"><b><u>{term}</u></b> ／ <b>{translation}</b>{translationRuby ? "〈"+translationRuby+"〉" : ""}</p>
                        <p className="text-left">{explanation}</p>
                    </>
                ),
                choices: ["OK"]
            });
            explanationsTemp = [...explanationsTemp.slice(undefined, index), ...explanationsTemp.slice(index+1)];
        }
    }

    // SPR
    timeline.push({
        type: HtmlButtonResponsePlugin,
        stimulus: renderToString(
            <div className="text-left">
                <p>これから、短い文章を表示します。</p>
                <p>ただし、文章が表示される位置には、はじめは下線のみ表示されています。スペースキーまたは画面下のボタンを押すと、文章が順に一部ずつ読めるようになるので、できるだけ自然なペースで読み進めてください。</p>
                <p>次のものは動作確認です。万一、表示崩れや動作不良などがありましたら、お手数ですが実験者にお知らせいただけますと大変助かります。</p>
            </div>
        ),
        choices: ["次へ"]
    });
    timeline.push({
        type: SelfPacedReadingPlugin,
        textline: [
            "この",
            "文章は",
            "動作確認の",
            "ための",
            "ものです。",
            "スペースキー",
            "または",
            "画面下の",
            "ボタンを",
            "押す",
            "ことに",
            "よって",
            "順に",
            "一部ずつ",
            "読める",
            "ように",
            "なって",
            "いる",
            "ことを",
            "ご確認",
            "ください。",
        ],
        header: renderToString(
            <p>(動作確認)</p>
        )
    })
    timeline.push({
        type: HtmlButtonResponsePlugin,
        stimulus: renderToString(
            <div className="text-left">
                <p>ここまでが動作確認です。万一、表示崩れや動作不良などがありましたら、お手数ですが実験者にお知らせいただけますと大変助かります。</p>
                <p>次からが本番です。できるだけ自然なペースで読み進めてください。</p>
            </div>
        ),
        choices: ["次へ"]
    });
    const numOfTextlines = textlines.length;
    let textlinesTemp = [...textlines];
    while (textlinesTemp.length > 0) {
        const [textline, index] = randomChoise(textlinesTemp);
        timeline.push({
            type: SelfPacedReadingPlugin,
            textline: textline,
            header: renderToString(
                <p>(文章 No. {numOfTextlines - textlinesTemp.length + 1} / {numOfTextlines})</p>
            )
        });
        textlinesTemp = [...textlinesTemp.slice(undefined, index), ...textlinesTemp.slice(index+1)];
    }

    return [timeline, minorTranslations] as [typeof timeline, typeof minorTranslations];
};
