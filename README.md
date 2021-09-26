# README

## Explanation for Quizshow
Quizshow world and MRE SDK app to play a round of Jeopardy with your friends (up to 3 teams). You can change the questions if you want.

## Enter the hosted AltspaceVR world
Up to this point you still have to join with the experimental version of AlspaceVR. Here are various links, choose the one that fits your platform:
  - experimental Altspace for Rift: https://aka.ms/AvrUrpOculus
  - experimental Altspace URP for SteamVR: https://aka.ms/AvrUrpSteam
  - experimental Altspace URP for WinMR: https://aka.ms/AvrUrpWinmr
  - experimental Altspace URP for Quest: https://aka.ms/AvrUrpQuest
  - experimental Altspace URP for Mac: https://aka.ms/AvrUrpMac

Unpack the downloaded .zip file and just start "AltspaceVR.exe". Log in to your AltspaceVR account and just enter the World-Code "FPL585" to enter the world.

## How to change the questions of the Quizshow
Just start the Excel document "Jeopardy_Interactive_Wall/Generate_Questions_JSON_File.xlsm" and make sure to enable Macros. If you press the "Create JSON" button, a "questions.json" file will be created.
If you want to change the number of questions, that will be a bit trcky because you have to change the Macro in the Excel file ("Jeopardy_Interactive_Wall/Generate_Questions_JSON_File.xlsm") and also the code for the quizshow ("Jeopardy_Interactive_Wall/src/app.ts").

## How to change the code of the Quizshow
The main portion of the code is contained in "Jeopardy_Interactive_Wall/src/app.ts". In this file you can alter the various parameters or change the code itself. If you changed something and want to publish the new code, you have to first deploy it to OpeNode.io. (It should then be automatically updated in AltspaceVR, maybe you have to reenter the world.)

## How to deploy the code to OpeNode.io
Just follow the steps here: https://github.com/Microsoft/mixed-reality-extension-sdk/blob/master/DEPLOYING.md#deploy-to-a-free-or-low-cost-cloud-service
NOTE: You can skip the steps to alter the Dockerfile, because it should be already set up correctly.

## How to change the Unity Scene
Add the "Jeopardy_Quizshow" folder as a Unity Project with the Unity version "2020.3.9f1". (NOTE: If you suspect the Unity version may have changed, then head to "https://docs.microsoft.com/en-us/windows/mixed-reality/altspace-vr/world-building/world-building-toolkit-getting-started#setup")
You need to download and install the latest Unity Uploader for AltspaceVR. See "https://docs.microsoft.com/en-us/windows/mixed-reality/altspace-vr/world-building/upgrading-content-to-the-latest-unity#altspacevr-uploader-v090-upgrade-guide".
Now you can start to alter the scene and follow the instructions here "https://docs.microsoft.com/en-us/windows/mixed-reality/altspace-vr/world-building/world-building-toolkit-getting-started#upload-your-scene".