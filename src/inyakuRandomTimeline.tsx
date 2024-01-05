import HtmlButtonResponsePlugin from "@jspsych/plugin-html-button-response";
import { SelfPacedReadingPlugin, Textline } from "./selfPacedReadingPlugin";
import { renderToString } from "react-dom/server";
import React from "react";

type TermSet = {
    mainReplacer: string, // カタカナ語
    subReplacer: (
        [string, string | null] |
        [string, string | null, string]
    )[], // 訳語（と読み）（と訳注）
    explanation: string, // 語釈
    textline: string, // 読文。{0}, {1} はカタカナ語／訳語によって置換
};
type SubExperiment = {
    mainReplacer: string, // カタカナ語
    subReplacer: string, // ここで使用する訳語
    subReplacerRuby: string | null, // 訳語読み
    subReplacerNote?: string, // 訳注
    subReplacerIndex: number, // 訳語のインデックス
    explanation: string | null, // 語釈または null
    textline: string,
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
    const [[subReplacer, subReplacerRuby, subReplacerNote], subReplacerIndex] = randomChoise(termSet.subReplacer);
    const explanation =
        Math.random() < 1/3 ?
        null :
        termSet.explanation;
    const textline = termSet.textline;
    return {
        mainReplacer: mainReplacer,
        subReplacer: subReplacer,
        subReplacerRuby: subReplacerRuby,
        subReplacerNote: subReplacerNote,
        subReplacerIndex: subReplacerIndex,
        explanation: explanation,
        textline: textline,
    }
};
export const inyakuRandomTimeline = (termSets: TermSet[]) => {
    let summary: {
        explanationOrder: number[], // explanation の順序。termSet のインデックスによる
        textlineOrder: number[], // textline の順序。termSet のインデックスによる
        details: Array<{
            explanation: number[] | null,
                // 説明に表示した言葉。
                // 説明なしの場合は null
                // 説明ありの場合は mainReplacer が -1 で subReplacer がそのインデックス
            textline: number[]
                // textline を置換した言葉。
                // mainReplacer が -1 で subReplacer がそのインデックス
        }>
    } = {
        explanationOrder: [],
        textlineOrder: [],
        details: (() => {
            let res: Array<{
                explanation: null,
                textline: []
            }> = [];
            for (let i = 0; i < termSets.length; i++) {
                res.push({
                    explanation: null,
                    textline: []
                });
            }
            return res;
        })()
    };

    const subExperiments = termSets.map(randomlyDetermineSubExperiment);
    let explanations: ([
        SubExperiment["mainReplacer"],
        SubExperiment["subReplacer"],
        SubExperiment["subReplacerRuby"],
        SubExperiment["subReplacerNote"],
        SubExperiment["subReplacerIndex"],
        SubExperiment["explanation"]
    ] | null)[] = [];
    let textlines: [
        SubExperiment["mainReplacer"],
        SubExperiment["subReplacer"],
        SubExperiment["subReplacerIndex"],
        SubExperiment["textline"]
    ][] = [];
    let minorTranslations: [
        SubExperiment["subReplacer"],
        SubExperiment["subReplacerRuby"],
        SubExperiment["subReplacerNote"],
        SubExperiment["mainReplacer"]
    ][] = [];
    subExperiments.forEach(subExperiment => {
        if (subExperiment.explanation == null) {
            explanations.push(null);
        } else {
            explanations.push([
                subExperiment.mainReplacer,
                subExperiment.subReplacer,
                subExperiment.subReplacerRuby,
                subExperiment.subReplacerNote,
                subExperiment.subReplacerIndex,
                subExperiment.explanation
            ]);
        }
        textlines.push([
            subExperiment.mainReplacer,
            subExperiment.subReplacer,
            subExperiment.subReplacerIndex,
            subExperiment.textline
        ]);
        if (subExperiment.subReplacerIndex > 0) {
            minorTranslations.push([
                subExperiment.subReplacer,
                subExperiment.subReplacerRuby,
                subExperiment.subReplacerNote,
                subExperiment.mainReplacer
            ]);
        }
    });

    const timeline: any[] = [];

    // 言葉の確認
    const numOfExplanations = explanations.filter(e => !!e).length;
    if (numOfExplanations > 0) {
        timeline.push({
            type: HtmlButtonResponsePlugin,
            stimulus: renderToString(
                <p>はじめに、次の言葉の意味をご確認ください。</p>
            ),
            choices: ["次へ"]
        });
        let explanationsTemp = explanations.map((e, originalIndex) => [originalIndex, e] as [typeof originalIndex, typeof e]);
        while (explanationsTemp.length > 0) {
            const [
                [
                    originalIndex,
                    possiblyNull,
                ],
                index
            ] = randomChoise(explanationsTemp);
            if (!!possiblyNull) {
                const [
                    term,
                    translation,
                    translationRuby,
                    translationNote,
                    translationIndex,
                    explanation
                ] = possiblyNull;
                const head = (termIndex: number) => {
                    if (termIndex == -1) {
                        return <b>{term}</b>
                    } else {
                        return <>
                            <b>{translation}</b>{translationRuby ? "〈"+translationRuby+"〉" : ""}
                        </>
                    }
                };
                const headIndexes =
                    Math.random() < 0.5 ?
                    [-1, translationIndex] :
                    [translationIndex, -1]
                timeline.push({
                    type: HtmlButtonResponsePlugin,
                    stimulus: renderToString(
                        <>
                            <p>
                                次の言葉の意味をご確認ください。
                                (No. {summary.explanationOrder.length + 1} / {numOfExplanations})
                            </p>
                            <div className="term-explanation">
                                <p className="text-left">{head(headIndexes[0])} ／ {head(headIndexes[1])}</p>
                                <p className="text-left">
                                    {explanation}
                                    {translationNote ? <><br/>{translationNote}</> : ""}
                                </p>
                            </div>
                        </>
                    ),
                    choices: ["OK"]
                });
                summary.explanationOrder.push(originalIndex);
                summary.details[originalIndex].explanation = headIndexes;
            }
            explanationsTemp = [...explanationsTemp.slice(undefined, index), ...explanationsTemp.slice(index+1)];
        }
    }

    // SPR
    timeline.push({
        type: HtmlButtonResponsePlugin,
        stimulus: renderToString(
            <div className="text-left">
                <p>これから、<b>短い文章を表示します</b>。</p>
                <p>ただし、文章が表示される位置には、<u>はじめは下線のみ表示されています</u>。<br/>{/*スペースキーまたは*/}画面下のボタンを押すと、文章が順に一部ずつ読めるようになるので、<u>できるだけ自然なペースで読み進めてください</u>。</p>
                <p><b>次のものは動作確認です</b>。<br/>万一、表示崩れや動作不良などがありましたら、お手数ですが実験者にお知らせいただけますと大変助かります。</p>
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
            // "スペースキー",
            // "または",
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
        header: <p>(動作確認)</p>
    });
    timeline.push({
        type: HtmlButtonResponsePlugin,
        stimulus: renderToString(
            <div className="text-left">
                <p>ここまでが動作確認です。<br/>万一、表示崩れや動作不良などがありましたら、お手数ですが実験者にお知らせいただけますと大変助かります。</p>
                <p>次からが本番です。<br/><u>できるだけ自然なペースで読み進めてください。</u></p>
            </div>
        ),
        choices: ["次へ"]
    });
    const numOfTextlines = textlines.length;
    let textlinesTemp = textlines.map((e, originalIndex) => [originalIndex, e] as [typeof originalIndex, typeof e]);;
    while (textlinesTemp.length > 0) {
        const [
            [
                originalIndex,
                [
                    term,
                    translation,
                    translationIndex,
                    textline
                ]
            ],
            index
        ] = randomChoise(textlinesTemp);
        const replacer = (termIndex: number) => {
            if (termIndex === -1) {
                return term;
            } else {
                return translation;
            }
        };
        const textlineReplacerIndexes =
            Math.random() < .5 ?
            [-1, translationIndex] :
            [translationIndex, -1];
        const textlineFormatted = format(textline, ...textlineReplacerIndexes.map(replacer)).split("|");
        timeline.push({
            type: SelfPacedReadingPlugin,
            textline: textlineFormatted,
            header: <p>(文章 No. {numOfTextlines - textlinesTemp.length + 1} / {numOfTextlines})</p>
        });
        summary.textlineOrder.push(originalIndex);
        summary.details[originalIndex].textline = textlineReplacerIndexes;
        textlinesTemp = [...textlinesTemp.slice(undefined, index), ...textlinesTemp.slice(index+1)];
    }
    return [summary, timeline, minorTranslations] as [typeof summary, typeof timeline, typeof minorTranslations];
};
