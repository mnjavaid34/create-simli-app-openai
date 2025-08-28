"use client";
import React, { use, useEffect, useState } from "react";
import SimliGemini from "./SimliGemini";
import DottedFace from "./Components/DottedFace";
import SimliHeaderLogo from "./Components/Logo";
import Navbar from "./Components/Navbar";
import Image from "next/image";
import GitHubLogo from "@/media/github-mark-white.svg";

interface avatarSettings {
  name: string;
  elevenlabs_voice_id: string;
  simli_faceid: string;
  initialPrompt: string;
}

// Customize your avatar here
const avatar: avatarSettings = {
  name: "Frank",
  elevenlabs_voice_id: "pNInz6obpgDQGcFmaJgB", // Adam voice - replace with your preferred Eleven Labs voice ID
  simli_faceid: "d8f9306d-7de9-45f6-80c5-b65314b7ed09",
  initialPrompt:
    "You are a helpful AI assistant named Frank. You are friendly and concise in your responses. Your task is to help users with any questions they might have. Your answers are short and to the point, don't give long answers be brief and straightforward.",
};

const Demo: React.FC = () => {
  const [showDottedFace, setShowDottedFace] = useState(true);

  const onStart = () => {
    console.log("Setting setshowDottedface to false...");
    setShowDottedFace(false);
  };

  const onClose = () => {
    console.log("Setting setshowDottedface to true...");
    setShowDottedFace(true);
  };

  return (
    <div className="bg-black min-h-screen flex flex-col items-center font-abc-repro font-normal text-sm text-white p-8">
      <SimliHeaderLogo />
      <Navbar />
      <div className="absolute top-[32px] right-[32px]">
        <text
          onClick={() => {
            window.open("https://github.com/simliai/create-simli-app-openai");
          }}
          className="font-bold cursor-pointer mb-8 text-xl leading-8"
        >
          <Image className="w-[20px] inline mr-2" src={GitHubLogo} alt="" />
          create-simli-app (Gemini + ElevenLabs)
        </text>
      </div>
      <div className="flex flex-col items-center gap-6 bg-effect15White p-6 pb-[40px] rounded-xl w-full">
        <div>
          {showDottedFace && <DottedFace />}
          <SimliGemini
            elevenlabs_voice_id={avatar.elevenlabs_voice_id}
            simli_faceid={avatar.simli_faceid}
            initialPrompt={avatar.initialPrompt}
            onStart={onStart}
            onClose={onClose}
            showDottedFace={showDottedFace}
          />
        </div>
      </div>

      <div className="max-w-[350px] font-thin flex flex-col items-center ">
        <span className="font-bold mb-[8px] leading-5 ">
          {" "}
          Create Simli App is a starter repo for creating visual avatars with
          Simli{" "}
        </span>
        <ul className="list-decimal list-inside max-w-[350px] ml-[6px] mt-2">
          <li className="mb-1">
            Fill in your Google AI API key (for Gemini 2.0 Flash) and Eleven Labs API key in .env file.
          </li>
          <li className="mb-1">
            Test out the interaction and have a talk with the Gemini-powered,
            ElevenLabs-voiced, Simli-visualized avatar.
          </li>
          <li className="mb-1">
            You can replace the avatar's face, voice, and prompt with your own. Do this
            by editing <code>app/page.tsx</code>.
          </li>
        </ul>
        <span className=" mt-[16px]">
          You can now deploy this app to Vercel, or incorporate it as part of
          your existing project.
        </span>
      </div>
    </div>
  );
};

export default Demo;
