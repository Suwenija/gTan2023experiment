import { JsPsych, JsPsychPlugin, ParameterType, TrialType } from "jspsych";

const info = {
    name: "send-to-google-form-plugin",
    parameters: {
        obj: {
            type: ParameterType.OBJECT,
            require: true,
        },
        formId: {
            type: ParameterType.STRING,
            require: true
        },
        entryId: {
            type: ParameterType.STRING,
            require: true
        },
    }
} as const;

type Info = typeof info;

export class SendToGoogleFormPlugin implements JsPsychPlugin<Info> {
    static info = info;
    constructor(private jsPsych: JsPsych) {}

    trial(display_element: HTMLElement, trial: TrialType<Info>) {
        const [formId, entryId] = [trial.formId, trial.entryId];
        if (!formId) {
            throw("`formId` is required.");
        }
        if (!entryId) {
            throw("`entryId` is required.");
        }

        const timestamp = Date.now();
        const rand = ((Math.random()+'').match(/0\.(.*)/) as RegExpMatchArray)[1];
        const id = `${timestamp}.${rand}`;
        const data = JSON.stringify(trial.obj);

        const sendToGoogleForm = (data: string, formId: string, entryId: string) => {
            const form_iframe = document.createElement("iframe");
            form_iframe.src = encodeURI(
                `https://docs.google.com/forms/d/e/${formId}/formResponse?entry.${entryId}=${data}&submit=Submit`);
            form_iframe.style.display = "none";
            document.body.appendChild(form_iframe);
        }

        data.match(/.{1,1000}/g)?.forEach((d, i) => {
            const packetId = `/*${id}.${i}*/`;
            sendToGoogleForm(packetId + d, formId, entryId);
        });
    }
}
