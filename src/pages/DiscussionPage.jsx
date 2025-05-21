// import React, { useEffect, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import styled from "styled-components";
// import Modal from "react-modal";
// import AudioRecorder from "../components/AudioRecorder";

// /* ---------- MBTI 프로필 이미지 ---------- */
// import isfj from "../assets/ISFJ.png";
// import entj from "../assets/ENTJ.png";
// import istp from "../assets/ISTP.png";
// import estj from "../assets/ESTJ.png";
// import enfp from "../assets/ENFP.png";
// import infj from "../assets/INFJ.png";
// import estp from "../assets/ESTP.png";
// import enfj from "../assets/ENFJ.png";
// import istj from "../assets/ISTJ.png";
// import intj from "../assets/INTJ.png";
// import intp from "../assets/INTP.png";
// import infp from "../assets/INFP.png";
// import esfp from "../assets/ESFP.png";
// import esfj from "../assets/ESFJ.png";
// import isfp from "../assets/ISFP.png";
// import entp from "../assets/ENTP.png";
// import user from "../assets/user.png";

// const allPersonasMap = {
//   ISFJ: isfj,
//   ENTJ: entj,
//   ISTP: istp,
//   ESTJ: estj,
//   ENFP: enfp,
//   INFJ: infj,
//   ESTP: estp,
//   ENFJ: enfj,
//   ISTJ: istj,
//   INTJ: intj,
//   INTP: intp,
//   INFP: infp,
//   ESFP: esfp,
//   ESFJ: esfj,
//   ISFP: isfp,
//   ENTP: entp,
//   User: user,
// };

// const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

// /* ---------- OpenAI 호출 ---------- */
// async function callOpenAI(messages) {
//   const res = await fetch("https://api.openai.com/v1/chat/completions", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${OPENAI_API_KEY}`,
//     },
//     body: JSON.stringify({
//       model: "gpt-4",
//       messages,
//       max_tokens: 300,
//     }),
//   });
//   const data = await res.json();
//   return data.choices[0].message;
// }

// /* ---------- Whisper STT 호출 ---------- */
// async function callSpeechToText(audioBlob) {
//   const form = new FormData();
//   form.append("file", audioBlob, "voice.webm");
//   form.append("model", "whisper-1");

//   const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
//     method: "POST",
//     headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
//     body: form,
//   });
//   const data = await res.json();
//   return data.text;
// }

// export default function DiscussionPage() {
//   const location = useLocation();
//   const navigate = useNavigate(); // 홈 이동
//   const { topic, personas, roles } = location.state || {};

//   /* ---------- state ---------- */
//   const defaultRoles = { pro: ["User"], con: [] };
//   const safeRoles = roles || defaultRoles;

//   const [messages, setMessages] = useState([]);
//   const [userInput, setUserInput] = useState("");
//   const [currentRound, setCurrentRound] = useState(1);
//   const [turnOrder, setTurnOrder] = useState([]);
//   const [currentTurn, setCurrentTurn] = useState(0);
//   const [isUserTurn, setIsUserTurn] = useState(false);
//   const [allRoundsMessages, setAllRoundsMessages] = useState([]);
//   const [showEndModal, setShowEndModal] = useState(false);
//   const [showVoteModal, setShowVoteModal] = useState(false);
//   const [isDiscussionActive, setIsDiscussionActive] = useState(true);
//   const [round3OpponentMessage, setRound3OpponentMessage] = useState(null);

//   /* ---------- 유틸 ---------- */
//   const removeQuotes = (text) =>
//     !text ? text : text.replace(/['"]/g, "").trim();
//   const userStance = safeRoles.pro.includes("User") ? "찬성" : "반대";

//   /* ---------- 라운드 1 초기 메시지 ---------- */
//   useEffect(() => {
//     if (!topic || !personas) return;

//     // 각 진영의 참가자 목록 설정 (유저 제외)
//     const pros = safeRoles.pro.filter((p) => p !== "User");
//     const cons = safeRoles.con.filter((p) => p !== "User");

//     // 참가자 정보 로깅
//     console.log("\n=== 참가자 정보 ===");
//     console.log("찬성 진영:", safeRoles.pro);
//     console.log("반대 진영:", safeRoles.con);
//     console.log("찬성 진영 (유저 제외):", pros);
//     console.log("반대 진영 (유저 제외):", cons);

//     // 유저의 진영에 따라 첫 발언자 순서 결정
//     // 유저는 항상 자신의 진영의 1번이 됨
//     const firstSpeakers =
//       userStance === "찬성"
//         ? ["User", cons[0]] // 찬성1(유저) -> 반대1
//         : [pros[0], "User"]; // 찬성1 -> 반대1(유저)

//     console.log("\n=== 라운드 1 발언 순서 ===");
//     console.log(
//       "찬성 진영:",
//       userStance === "찬성" ? ["User", pros[0]] : [pros[0], pros[1]]
//     );
//     console.log(
//       "반대 진영:",
//       userStance === "반대" ? ["User", cons[0]] : [cons[0], cons[1]]
//     );
//     console.log("첫 발언 순서:", firstSpeakers);

//     setTurnOrder(firstSpeakers);

//     // 라운드 2의 발언 순서 설정
//     const round2Order = [
//       safeRoles.pro[1], // 찬성2
//       safeRoles.con[1], // 반대2
//       safeRoles.pro[0], // 찬성1
//       safeRoles.con[0], // 반대1
//       safeRoles.pro[1], // 찬성2
//       safeRoles.con[1], // 반대2
//     ];

//     // 라운드 3의 발언 순서 설정 (찬성1과 반대1만)
//     const round3Order =
//       userStance === "찬성"
//         ? ["User", safeRoles.con[0]] // 찬성1(유저) -> 반대1
//         : [safeRoles.pro[0], "User"]; // 찬성1 -> 반대1(유저)

//     // 순서 확인을 위한 로깅
//     console.log("\n=== 라운드 2 발언 순서 ===");
//     console.log("현재 참가자 정보:");
//     console.log("- 찬성1:", safeRoles.pro[0]);
//     console.log("- 찬성2:", safeRoles.pro[1]);
//     console.log("- 반대1:", safeRoles.con[0]);
//     console.log("- 반대2:", safeRoles.con[1]);

//     console.log("\n전체 발언 순서:");
//     round2Order.forEach((speaker, idx) => {
//       const role =
//         speaker === safeRoles.pro[0]
//           ? "찬성1"
//           : speaker === safeRoles.pro[1]
//           ? "찬성2"
//           : speaker === safeRoles.con[0]
//           ? "반대1"
//           : "반대2";
//       console.log(`${idx + 1}. ${role}(${speaker})`);
//     });

//     // 라운드 2 시작 시 발언 순서 업데이트
//     if (currentRound === 2) {
//       setTurnOrder(round2Order);
//     }

//     // 라운드 3 시작 시 발언 순서 업데이트
//     if (currentRound === 3) {
//       console.log("\n=== 라운드 3 발언 순서 설정 ===");
//       console.log("유저 진영:", userStance);
//       console.log("찬성1:", safeRoles.pro[0]);
//       console.log("반대1:", safeRoles.con[0]);

//       // 유저의 진영에 따라 라운드 3의 발언 순서 설정
//       const finalRound3Order =
//         userStance === "찬성"
//           ? ["User", safeRoles.con[0]] // 찬성1(유저) -> 반대1
//           : [safeRoles.pro[0], "User"]; // 찬성1 -> 반대1(유저)

//       console.log("라운드 3 발언 순서:", finalRound3Order);
//       setTurnOrder(finalRound3Order);
//     }

//     (async () => {
//       if (currentRound !== 1 || currentTurn !== 0) return;
//       const firstMsgs = [];

//       for (const name of firstSpeakers) {
//         if (name === "User") {
//           firstMsgs.push({ sender: "User", content: null, stance: userStance });
//           continue;
//         }
//         const stance = safeRoles.pro.includes(name) ? "찬성" : "반대";
//         const sys = {
//           role: "system",
//           content:
//             `당신은 ${name} MBTI 토론자입니다. 주제: "${topic}". ` +
//             `${stance} 입장에서 ${name} MBTI 성향을 말투에 반영하여 한두 문장 첫 발언하되, 당신의 MBTI를 직접적으로 언급하는 답변은 하지마`,
//         };
//         const reply = await callOpenAI([sys]);
//         firstMsgs.push({
//           sender: name,
//           content: removeQuotes(reply.content),
//           stance,
//           mbti: name,
//         });
//       }
//       setAllRoundsMessages(firstMsgs);
//     })();
//   }, [topic, personas, safeRoles, currentRound]);

//   /* ---------- 라운드 2·3 GPT 메시지 추가 ---------- */
//   useEffect(() => {
//     if (currentRound === 2 && !isUserTurn && isDiscussionActive) {
//       (async () => {
//         const newMsgs = await getMessages();
//         if (newMsgs && newMsgs.length > 0) {
//           // 마지막 턴인 경우 중복 방지를 위해 메시지 추가 전에 확인
//           if (currentTurn === 5) {
//             const lastMessage = allRoundsMessages[allRoundsMessages.length - 1];
//             if (lastMessage && lastMessage.content === newMsgs[0].content) {
//               // 이미 동일한 메시지가 있다면 추가하지 않음
//               setCurrentRound(3);
//               setCurrentTurn(0);

//               // 라운드 3 상대방 메시지 생성
//               const opponentMsg = await generateRound3OpponentMessage();
//               setRound3OpponentMessage(opponentMsg);

//               // 유저가 찬성인 경우에만 유저 입력 대기
//               if (userStance === "찬성") {
//                 setIsUserTurn(true);
//               } else {
//                 // 반대인 경우 상대방 메시지를 바로 표시
//                 if (opponentMsg) {
//                   setMessages((prev) => [...prev, opponentMsg]);
//                   setAllRoundsMessages((prev) => [...prev, opponentMsg]);
//                 }
//                 setIsUserTurn(true);
//               }
//               return;
//             }
//           }

//           setAllRoundsMessages((prev) => [...prev, ...newMsgs]);
//           setMessages((prev) => [...prev, ...newMsgs]);

//           if (currentTurn < 5) {
//             advanceTurn({ 1: 2, 2: 6, 3: 2 });
//           } else if (currentTurn === 5) {
//             setCurrentRound(3);
//             setCurrentTurn(0);

//             // 라운드 3 상대방 메시지 생성
//             const opponentMsg = await generateRound3OpponentMessage();
//             setRound3OpponentMessage(opponentMsg);

//             // 유저가 찬성인 경우에만 유저 입력 대기
//             if (userStance === "찬성") {
//               setIsUserTurn(true);
//             } else {
//               // 반대인 경우 상대방 메시지를 바로 표시
//               if (opponentMsg) {
//                 setMessages((prev) => [...prev, opponentMsg]);
//                 setAllRoundsMessages((prev) => [...prev, opponentMsg]);
//               }
//               setIsUserTurn(true);
//             }
//           }
//         }
//       })();
//     }
//   }, [
//     currentRound,
//     currentTurn,
//     isUserTurn,
//     isDiscussionActive,
//     userStance,
//     allRoundsMessages,
//   ]);

//   /* ---------- 라운드 3 상대방 메시지 생성 함수 ---------- */
//   const generateRound3OpponentMessage = async () => {
//     const messageTexts = allRoundsMessages
//       .filter((msg) => msg && msg.content)
//       .map((msg) => `${msg.content}`);

//     // 상대방 정보 설정
//     const opponentName =
//       userStance === "찬성" ? safeRoles.con[0] : safeRoles.pro[0];
//     const opponentStance = userStance === "찬성" ? "반대" : "찬성";

//     const prompt =
//       `당신은 ${opponentName} MBTI 토론자입니다. 주제: "${topic}".\n\n` +
//       `지금까지의 전체 토론 내용입니다:\n${messageTexts.join("\n")}\n\n` +
//       `위의 모든 발언을 참고하여, ${opponentStance} 입장에서 최종 변론을 해주세요. ` +
//       `지금까지의 토론을 종합하여 가장 강력한 주장을 펼쳐주세요. ` +
//       `반드시 두 문장 이내로만 명료하게 답변해주세요. ` +
//       `${opponentStance} 입장에서 ${opponentName} MBTI 성향을 말투에 반영하여 성격을 말투에 반영하되 MBTI를 직접적으로 언급하지는 마세요. ` +
//       `반드시 존댓말을 사용해주세요.`;

//     const reply = await callOpenAI([
//       { role: "system", content: prompt },
//       ...messageTexts.map((msg) => ({
//         role: "user",
//         content: msg,
//       })),
//     ]);

//     if (reply && reply.content) {
//       return {
//         sender: opponentName,
//         content: removeQuotes(reply.content),
//         stance: opponentStance,
//         mbti: opponentName,
//       };
//     }
//     return null;
//   };

//   /* ---------- 메시지 한 개씩 출력 ---------- */
//   useEffect(() => {
//     const maxTurns = { 1: 2, 2: 6, 3: 2 };

//     if (!isDiscussionActive || currentRound === 3) {
//       return;
//     }

//     const roundStartIdx = { 1: 0, 2: 2, 3: 8 };
//     const idx = roundStartIdx[currentRound] + currentTurn;

//     // 각 진영의 참가자 목록 설정 (유저 제외)
//     const pros = safeRoles.pro.filter((p) => p !== "User");
//     const cons = safeRoles.con.filter((p) => p !== "User");

//     // 라운드 2의 발언 순서 설정
//     const round2Order = [
//       safeRoles.pro[1], // 찬성2
//       safeRoles.con[1], // 반대2
//       safeRoles.pro[0], // 찬성1
//       safeRoles.con[0], // 반대1
//       safeRoles.pro[1], // 찬성2
//       safeRoles.con[1], // 반대2
//     ];

//     // 라운드 3의 발언 순서 설정 (찬성1과 반대1만)
//     const round3Order =
//       userStance === "찬성"
//         ? ["User", safeRoles.con[0]] // 찬성1(유저) -> 반대1
//         : [pros[0], "User"]; // 찬성1 -> 반대1(유저)

//     // 현재 라운드의 발언 순서 결정
//     const currentOrder =
//       currentRound === 2
//         ? round2Order
//         : currentRound === 3
//         ? round3Order
//         : turnOrder;

//     // 유저 차례인지 먼저 확인
//     const isCurrentUserTurn = currentOrder[currentTurn] === "User";

//     if (isCurrentUserTurn) {
//       console.log("\n=== 유저 차례 ===");
//       setIsUserTurn(true);
//       return;
//     }

//     // 현재 발언자 확인
//     const currentSpeaker = currentOrder[currentTurn];
//     console.log(`\n=== ${currentSpeaker}의 발언 차례 ===`);

//     const timer = setTimeout(async () => {
//       if (!allRoundsMessages[idx]) return;

//       const msg = allRoundsMessages[idx];
//       if (msg.sender === "User") {
//         console.log("\n=== 유저 차례 ===");
//         setIsUserTurn(true);
//         return;
//       }

//       // 중복 메시지 체크
//       const isDuplicate = messages.some(
//         (m) =>
//           m.sender === msg.sender &&
//           m.content === msg.content &&
//           m.stance === msg.stance
//       );

//       if (!isDuplicate) {
//         setMessages((prev) => [...prev, msg]);
//       }

//       advanceTurn(maxTurns);
//     }, 2000);

//     return () => clearTimeout(timer);
//   }, [
//     allRoundsMessages,
//     currentTurn,
//     currentRound,
//     turnOrder,
//     safeRoles,
//     userStance,
//     isDiscussionActive,
//     messages,
//   ]);

//   const advanceTurn = (maxTurns) => {
//     console.log("\n=== 턴 진행 ===");
//     console.log("현재 라운드:", currentRound);
//     console.log("현재 턴:", currentTurn);
//     console.log("최대 턴:", maxTurns[currentRound]);

//     setCurrentTurn((prev) => {
//       const nextTurn = prev + 1;
//       console.log("다음 턴:", nextTurn);

//       // 라운드 전환 체크
//       if (currentRound === 1 && nextTurn === maxTurns[1]) {
//         console.log("라운드 1 종료, 라운드 2 시작");
//         setCurrentRound(2);
//         return 0;
//       } else if (currentRound === 2 && nextTurn === maxTurns[2]) {
//         console.log("라운드 2 종료, 라운드 3 시작");
//         setCurrentRound(3);
//         return 0;
//       }
//       return nextTurn;
//     });
//   };

//   /* ---------- 음성 입력 처리 ---------- */
//   const handleSendFromVoice = async (audioBlob) => {
//     if (!isDiscussionActive) return;
//     // 1) STT
//     const userText = await callSpeechToText(audioBlob);
//     // 2) 유저 메시지 추가
//     const newMsg = { sender: "User", content: userText, stance: userStance };
//     setMessages((prev) => [...prev, newMsg]);
//     setAllRoundsMessages((prev) => {
//       const up = [...prev];
//       const startIdx = { 1: 0, 2: 2, 3: 8 };
//       up[startIdx[currentRound] + currentTurn] = newMsg;
//       return up;
//     });
//     setIsUserTurn(false);

//     // 3) 라운드3 처리
//     if (currentRound === 3) {
//       if (userStance === "찬성" && round3OpponentMessage) {
//         setMessages((p) => [...p, round3OpponentMessage]);
//         setAllRoundsMessages((p) => [...p, round3OpponentMessage]);
//       }
//       setShowVoteModal(true);
//       setIsDiscussionActive(false);
//     } else {
//       // 4) 다음 턴
//       advanceTurn({ 1: 2, 2: 6, 3: 2 });
//     }
//   };

//   /* ---------- 유저 전송 ---------- */
//   const handleSend = () => {
//     if (!userInput.trim() || !isDiscussionActive) return;
//     const newMsg = { sender: "User", content: userInput, stance: userStance };

//     setMessages((prev) => [...prev, newMsg]);
//     setAllRoundsMessages((prev) => {
//       const up = [...prev];
//       const roundStartIdx = { 1: 0, 2: 2, 3: 8 };
//       const idx = roundStartIdx[currentRound] + currentTurn;
//       up[idx] = newMsg;
//       return up;
//     });

//     setUserInput("");
//     setIsUserTurn(false);

//     // 라운드 3의 경우
//     if (currentRound === 3) {
//       // 찬성인 경우에만 상대방의 미리 생성된 메시지 표시
//       if (userStance === "찬성" && round3OpponentMessage) {
//         setMessages((prev) => [...prev, round3OpponentMessage]);
//         setAllRoundsMessages((prev) => [...prev, round3OpponentMessage]);
//       }
//       // 투표 모달 표시 및 토론 종료
//       setShowVoteModal(true);
//       setIsDiscussionActive(false);
//     } else {
//       advanceTurn({ 1: 2, 2: 6, 3: 2 });
//     }
//   };

//   /* ---------- GPT 메시지 생성 ---------- */
//   const getMessages = async () => {
//     // 라운드 3는 미리 생성된 메시지를 사용하므로 여기서는 처리하지 않음
//     if (currentRound === 3) {
//       return [];
//     }

//     // 각 진영의 참가자 목록 설정 (유저 제외)
//     const pros = safeRoles.pro.filter((p) => p !== "User");
//     const cons = safeRoles.con.filter((p) => p !== "User");

//     // 라운드 2의 발언 순서 설정
//     const round2Order = [
//       safeRoles.pro[1], // 찬성2
//       safeRoles.con[1], // 반대2
//       safeRoles.pro[0], // 찬성1
//       safeRoles.con[0], // 반대1
//       safeRoles.pro[1], // 찬성2
//       safeRoles.con[1], // 반대2
//     ];

//     // 라운드 3의 발언 순서 설정 (찬성1과 반대1만)
//     const round3Order =
//       userStance === "찬성"
//         ? ["User", safeRoles.con[0]] // 찬성1(유저) -> 반대1
//         : [pros[0], "User"]; // 찬성1 -> 반대1(유저)

//     // 현재 라운드에 따른 발언 순서 결정
//     const currentOrder =
//       currentRound === 2
//         ? round2Order
//         : currentRound === 3
//         ? round3Order
//         : turnOrder;

//     // 현재 발언자가 유저인 경우 메시지 생성 건너뛰기
//     const currentSpeaker = currentOrder[currentTurn];
//     if (currentSpeaker === "User") {
//       console.log("유저 차례 감지 - 메시지 생성 중단");
//       setIsUserTurn(true);
//       return [];
//     }

//     const messages = [];
//     let accumulatedMessages = [...allRoundsMessages]; // 현재까지의 모든 메시지 복사

//     // 라운드 2는 순차적으로 처리
//     if (currentRound === 2) {
//       console.log("\n=== 라운드 2 메시지 생성 시작 ===");
//       console.log("현재 턴:", currentTurn);
//       console.log("남은 턴:", round2Order.length - currentTurn);

//       // 현재 턴의 발화자만 처리
//       const name = currentOrder[currentTurn];
//       const stance = safeRoles.pro.includes(name) ? "찬성" : "반대";

//       // 메시지 히스토리를 자연스러운 대화 형식으로 변환
//       const messageHistory = accumulatedMessages
//         .filter((msg) => msg && msg.content)
//         .map((msg) => ({
//           role: "user",
//           content: msg.content,
//         }));

//       // 직전 발언자와 메시지 확인
//       const previousSpeaker =
//         currentTurn > 0 ? currentOrder[currentTurn - 1] : null;
//       const previousMessage = previousSpeaker
//         ? accumulatedMessages[accumulatedMessages.length - 1]
//         : null;

//       console.log("\n=== 발언자 정보 ===");
//       console.log("현재 발언자:", name);
//       console.log("현재 발언자 진영:", stance);
//       console.log("직전 발언자:", previousSpeaker);
//       console.log(
//         "직전 발언자 메시지:",
//         previousMessage ? previousMessage.content : "첫 발언"
//       );
//       console.log(
//         "직전 발언자 진영:",
//         previousMessage ? previousMessage.stance : "없음"
//       );

//       console.log("\n=== 전체 메시지 히스토리 ===");
//       accumulatedMessages.forEach((msg, idx) => {
//         console.log(`${idx + 1}. ${msg.sender}(${msg.stance}): ${msg.content}`);
//       });

//       const prompt =
//         `당신은 ${name} MBTI 토론자입니다. 주제: "${topic}".\n\n` +
//         `직전 발언자(${previousSpeaker})의 메시지:\n` +
//         `${previousMessage ? previousMessage.content : "첫 발언"}\n\n` +
//         `${stance} 입장에서 대화해주세요. ` +
//         `실제 사람이 대화하는 것처럼 자연스럽게 말해주세요.\n\n` +
//         `답변은 두 문장으로 해주세요:\n` +
//         `1. 첫 문장에서는 직전 발언자의 주장에 대한 반응을 보여주세요. (예: "음... 생명의 소중함을 강조하시는 건 이해가 가요. 하지만 그게 여성의 선택권을 제한할 이유가 될 수 있을까요?")` +
//         `2. 두 번째 문장에서는 ${stance} 입장의 핵심 주장을 펼쳐주세요.\n\n` +
//         `주의사항:\n` +
//         `- 실제 사람이 대화하는 것처럼 자연스럽게 말해주세요. (예: "음...", "글쎄요...", "아니요, 제 생각에는..." 등)` +
//         `- ${name} MBTI의 특성을 말투에 자연스럽게 반영해주세요.` +
//         `- MBTI를 직접적으로 언급하지 말고, 아웃풋에 대한 추가 파싱 및 핸들링이 없어도 되게끔 대화체로만 말해주세요.` +
//         `- 존댓말을 사용하되, 너무 격식적이지 않게 일상적인 대화체로 말해주세요.` +
//         `- JSON 형식이나 다른 구조화된 형식으로 응답하지 마세요. 순수한 대화체로만 응답해주세요.` +
//         `- 발언자 정보나 진영을 직접 언급하지 마세요. (예: "STP(찬성):" 같은 형식 사용 금지)`;

//       console.log("\n=== GPT 프롬프트 ===");
//       console.log(prompt);

//       const reply = await callOpenAI([
//         { role: "system", content: prompt },
//         ...messageHistory,
//       ]);

//       if (!reply || !reply.content) {
//         console.error("Invalid reply from OpenAI");
//         return null;
//       }

//       // JSON 형식 응답 처리
//       let content = removeQuotes(reply.content);
//       try {
//         // JSON 형식인지 확인
//         const jsonMatch = content.match(/^\{.*\}$/s);
//         if (jsonMatch) {
//           const jsonContent = JSON.parse(jsonMatch[0]);
//           if (jsonContent.content) {
//             content = jsonContent.content;
//           }
//         }
//       } catch (e) {
//         // JSON 파싱 실패 시 원본 내용 유지
//         console.log("응답이 JSON 형식이 아닙니다:", content);
//       }

//       // 발언자 정보나 진영이 포함된 경우 제거
//       content = content.replace(/^[^(]+\([^)]+\):\s*/g, "");

//       const message = {
//         sender: name,
//         content: content,
//         stance,
//         mbti: name,
//       };

//       console.log("\n=== 생성된 메시지 ===");
//       console.log("발언자:", message.sender);
//       console.log("진영:", message.stance);
//       console.log("내용:", message.content);

//       messages.push(message);
//       return messages;
//     } else if (currentRound === 3) {
//       // 라운드 3는 전체 토론 내용을 참고
//       const messageTexts = allRoundsMessages
//         .filter((msg) => msg && msg.content)
//         .map((msg) => `${msg.content}`);

//       // 현재 턴의 발화자만 처리
//       const name = currentOrder[currentTurn];

//       // 유저 차례인 경우 건너뛰기
//       if (name === "User") {
//         console.log("라운드 3 유저 차례 감지 - 메시지 생성 중단");
//         setIsUserTurn(true);
//         return [];
//       }

//       const stance = safeRoles.pro.includes(name) ? "찬성" : "반대";

//       const prompt =
//         `당신은 ${name} MBTI 토론자입니다. 주제: "${topic}".\n\n` +
//         `지금까지의 전체 토론 내용입니다:\n${messageTexts.join("\n")}\n\n` +
//         `위의 모든 발언을 참고하여, ${stance} 입장에서 최종 변론을 해주세요. ` +
//         `지금까지의 토론을 종합하여 가장 강력한 주장을 펼쳐주세요. ` +
//         `반드시 두 문장 이내로만 명료하게 답변해주세요. ` +
//         `${stance} 입장에서 ${name} MBTI 성향을 말투에 반영하여 성격을 말투에 반영하되 MBTI를 직접적으로 언급하지는 마세요. ` +
//         `반드시 존댓말을 사용해주세요.`;

//       const reply = await callOpenAI([
//         { role: "system", content: prompt },
//         ...messageTexts.map((msg) => ({
//           role: "user",
//           content: msg,
//         })),
//       ]);

//       if (!reply || !reply.content) {
//         console.error("Invalid reply from OpenAI");
//         return null;
//       }

//       messages.push({
//         sender: name,
//         content: removeQuotes(reply.content),
//         stance,
//         mbti: name,
//       });
//       return messages;
//     } else {
//       // 라운드 1은 첫 발언만
//       for (const name of currentOrder) {
//         const stance = safeRoles.pro.includes(name) ? "찬성" : "반대";

//         const prompt =
//           `당신은 ${name} MBTI 토론자입니다. 주제: "${topic}". ` +
//           `${stance} 입장에서 ${name} MBTI 성향을 말투에 반영하여 첫 발언해주세요. ` +
//           `반드시 두 문장 이내로만 명료하게 답변해주세요. ` +
//           `MBTI를 직접 언급하지는 마세요. ` +
//           `반드시 존댓말을 사용해주세요.`;

//         const reply = await callOpenAI([{ role: "system", content: prompt }]);

//         if (!reply || !reply.content) {
//           console.error("Invalid reply from OpenAI");
//           return null;
//         }

//         messages.push({
//           sender: name,
//           content: removeQuotes(reply.content),
//           stance,
//           mbti: name,
//         });
//       }
//       return messages;
//     }
//   };

//   const roundLabels = {
//     1: "🗣️ 입론 : 나의 첫 주장을 펼쳐요",
//     2: "🔄 반론 : 상대 의견에 반박해요",
//     3: "🎯 최종 변론 : 내 입장을 정리해요",
//   };

//   /* ---------- 렌더 ---------- */
//   return (
//     <PageContainer>
//       <Header>📢 토론 주제: "{topic}"</Header>
//       <RoundIndicator>{roundLabels[currentRound]}</RoundIndicator>

//       <ChatArea>
//         {messages.map((m, i) => (
//           <Message key={i} isUser={m.sender === "User"} {...m} />
//         ))}
//       </ChatArea>

//       {/* {isUserTurn && (
//         <InputArea>
//           <TextInput
//             value={userInput}
//             onChange={(e) => setUserInput(e.target.value)}
//             placeholder="당신의 차례입니다. 논리정연하게 두 문장 이내로 발언해 주세요."
//           />
//           <SendButton onClick={handleSend}>전송</SendButton>
//         </InputArea>
//       )} */}
//       {isUserTurn && (
//         <RecorderArea>
//           <AudioRecorder
//             isRecordingAllowed={true}
//             onRecordingStop={handleSendFromVoice}
//           />
//         </RecorderArea>
//       )}

//       <Modal
//         isOpen={showVoteModal}
//         onRequestClose={() => setShowVoteModal(false)}
//         style={{
//           content: {
//             inset: "40% auto auto 50%",
//             transform: "translate(-50%,-50%)",
//             width: 500,
//             borderRadius: 14,
//             padding: "32px 40px",
//             textAlign: "center",
//           },
//           overlay: { backgroundColor: "rgba(0,0,0,0.45)" },
//         }}
//       >
//         <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>
//           🗳️ 토론 이후, 입장 변화에 대해 투표해 주세요
//         </h2>
//         <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
//           <button
//             onClick={() => {
//               setShowVoteModal(false); // ✅ 투표 모달 닫고
//               setShowEndModal(true); // ✅ 종료 모달 열기
//             }}
//             style={{
//               padding: "10px 28px",
//               background: "#4caf50",
//               color: "#fff",
//               border: "none",
//               borderRadius: 8,
//               fontWeight: 600,
//               fontSize: 20,
//               cursor: "pointer",
//             }}
//           >
//             찬성
//           </button>
//           <button
//             onClick={() => {
//               setShowVoteModal(false);
//               setShowEndModal(true);
//             }}
//             style={{
//               padding: "10px 28px",
//               background: "#f44336",
//               color: "#fff",
//               border: "none",
//               borderRadius: 8,
//               fontWeight: 600,
//               fontSize: 20,
//               cursor: "pointer",
//             }}
//           >
//             반대
//           </button>
//         </div>
//       </Modal>

//       {/* ---------- 종료 모달 ---------- */}
//       <Modal
//         isOpen={showEndModal}
//         onRequestClose={() => setShowEndModal(false)}
//         style={{
//           content: {
//             inset: "40% auto auto 50%",
//             transform: "translate(-50%,-50%)",
//             width: 420,
//             borderRadius: 14,
//             padding: "32px 40px",
//             textAlign: "center",
//           },
//           overlay: { backgroundColor: "rgba(0,0,0,0.45)" },
//         }}
//       >
//         <h3
//           style={{
//             fontSize: 30,
//             fontWeight: 800,
//             color: "#000000",
//             marginBottom: 10,
//           }}
//         >
//           🗳️ 투표 결과 🗳️
//         </h3>
//         <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
//           찬성 : 3표, 반대 : 1표
//         </h2>
//         <p style={{ marginBottom: 32, fontSize: 18 }}>
//           새로운 토론을 시작하시겠습니까?
//         </p>
//         <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
//           <button
//             onClick={() => navigate("/")}
//             style={{
//               padding: "10px 28px",
//               background: "#6c63ff",
//               color: "#fff",
//               border: "none",
//               borderRadius: 8,
//               fontWeight: 600,
//               fontSize: 20,
//               cursor: "pointer",
//             }}
//           >
//             예
//           </button>
//           <button
//             onClick={() => setShowEndModal(false)}
//             style={{
//               padding: "10px 28px",
//               background: "#e0e0e0",
//               border: "none",
//               borderRadius: 8,
//               fontWeight: 600,
//               fontSize: 20,
//               cursor: "pointer",
//             }}
//           >
//             아니오
//           </button>
//         </div>
//       </Modal>
//     </PageContainer>
//   );
// }

// /* ---------- 말풍선 + 프로필 ---------- */
// const Message = ({ isUser, sender, content, stance, mbti }) => {
//   const profileImg = allPersonasMap[mbti || sender] || user;
//   return (
//     <MessageContainer $isUser={isUser}>
//       {!isUser && (
//         <ProfileBox>
//           <ProfileImg src={profileImg} alt={mbti || sender} />
//           <MBTILabel>{mbti || sender}</MBTILabel>
//         </ProfileBox>
//       )}
//       <Bubble $isUser={isUser}>
//         <Text>{content}</Text>
//         <StanceTag $isPro={stance === "찬성"}>{stance}</StanceTag>
//       </Bubble>
//     </MessageContainer>
//   );
// };

// /* ---------- styled-components ---------- */
// const PageContainer = styled.div`
//   display: flex;
//   flex-direction: column;
//   height: 100vh;
//   overflow: hidden;
// `;

// const Header = styled.div`
//   font-size: 40px;
//   font-weight: 800;
//   margin: 30px 0;
//   color: #000000;
//   background-color: #ffffff;
//   display: flex;
//   justify-content: center;
// `;

// const RoundIndicator = styled.div`
//   font-size: 30px;
//   font-weight: 700;
//   padding-top: 20px;
//   padding-bottom: 20px;
//   color: #ffffff;
//   background-color: #000000;
//   display: flex;
//   justify-content: center;
// `;

// const ChatArea = styled.div`
//   flex: 1;
//   background: #dfdfdf;
//   overflow-y: auto;
//   padding: 20px 30px;
// `;

// const InputArea = styled.div`
//   display: flex;
//   gap: 20px;
//   //margin: 30px;
//   padding: 20px 30px;
// `;

// const TextInput = styled.input`
//   flex: 1;
//   padding: 8px;
//   font-size: 16px;
// `;

// const SendButton = styled.button`
//   padding: 8px 16px;
//   font-size: 16px;
//   background: #6c63ff;
//   color: #fff;
//   border: none;
//   border-radius: 4px;
//   cursor: pointer;
// `;

// const MessageContainer = styled.div`
//   display: flex;
//   flex-direction: ${({ $isUser }) => ($isUser ? "row-reverse" : "row")};
//   align-items: center;
//   margin: 10px 30px;
// `;

// const ProfileBox = styled.div`
//   display: flex;
//   flex-direction: column;
//   align-items: center;
// `;

// const MBTILabel = styled.div`
//   margin-top: 4px;
//   font-size: 20px;
//   font-weight: 800;
// `;

// const ProfileImg = styled.img`
//   width: 70px;
//   height: 70px;
//   border-radius: 50%;
//   margin: 0 10px;
// `;

// const Bubble = styled.div`
//   max-width: 50%;
//   background: ${({ $isUser }) => ($isUser ? "#000" : "#f1f1f1")};
//   color: ${({ $isUser }) => ($isUser ? "#fff" : "#000")};
//   padding: 14px 20px;
//   border-radius: 20px;
//   font-size: 20px;
// `;

// const Text = styled.div`
//   white-space: pre-line;
// `;

// const StanceTag = styled.div`
//   font-size: 15px;
//   margin-top: 6px;
//   text-align: right;
//   color: ${({ $isPro }) => ($isPro ? "#4caf50" : "#f44336")};
//   font-weight: 800;
// `;

// const RecorderArea = styled.div`
//   display: flex;
//   justify-content: center;
//   padding: 20px;
// `;
import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import Modal from "react-modal";

/* ---------- MBTI 프로필 이미지 ---------- */
import isfj from "../assets/ISFJ.png";
import entj from "../assets/ENTJ.png";
import istp from "../assets/ISTP.png";
import estj from "../assets/ESTJ.png";
import enfp from "../assets/ENFP.png";
import infj from "../assets/INFJ.png";
import estp from "../assets/ESTP.png";
import enfj from "../assets/ENFJ.png";
import istj from "../assets/ISTJ.png";
import intj from "../assets/INTJ.png";
import intp from "../assets/INTP.png";
import infp from "../assets/INFP.png";
import esfp from "../assets/ESFP.png";
import esfj from "../assets/ESFJ.png";
import isfp from "../assets/ISFP.png";
import entp from "../assets/ENTP.png";
import user from "../assets/user.png";

const allPersonasMap = {
  ISFJ: isfj,
  ENTJ: entj,
  ISTP: istp,
  ESTJ: estj,
  ENFP: enfp,
  INFJ: infj,
  ESTP: estp,
  ENFJ: enfj,
  ISTJ: istj,
  INTJ: intj,
  INTP: intp,
  INFP: infp,
  ESFP: esfp,
  ESFJ: esfj,
  ISFP: isfp,
  ENTP: entp,
  User: user,
};

const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

/* ---------- OpenAI 호출 ---------- */
async function callOpenAI(messages) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages,
      max_tokens: 300,
    }),
  });
  const data = await res.json();
  return data.choices[0].message;
}

/* ---------- useAudioRecorder 훅 ---------- */
const useAudioRecorder = (isListening, onRecordingComplete) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationIdRef = useRef(null);
  const voiceStartTimerRef = useRef(null);
  const voiceStopTimerRef = useRef(null);
  const VOICE_START_DEBOUNCE = 50; // ms
  const VOICE_STOP_DEBOUNCE = 2500; // ms

  useEffect(() => {
    let stream;

    const initializeMedia = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContextRef.current = new (window.AudioContext ||
          window.webkitAudioContext)();
        const sourceNode =
          audioContextRef.current.createMediaStreamSource(stream);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 512;
        sourceNode.connect(analyserRef.current);
        mediaRecorderRef.current = new MediaRecorder(stream, {
          mimeType: "audio/webm",
        });
        mediaRecorderRef.current.ondataavailable = (event) => {
          chunksRef.current.push(event.data);
        };
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          chunksRef.current = [];
          if (onRecordingComplete) {
            onRecordingComplete(blob);
          }
        };
      } catch (err) {
        console.error("마이크 접근 오류:", err);
        alert("마이크 권한이 필요합니다. 설정에서 허용해주세요.");
      }
    };

    const detectVoice = () => {
      if (!analyserRef.current) return;

      const dataArray = new Uint8Array(analyserRef.current.fftSize);
      analyserRef.current.getByteTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const sample = dataArray[i] - 128;
        sum += sample * sample;
      }
      const rms = Math.sqrt(sum / dataArray.length);
      const currentVolume = rms / 128;
      const threshold = 0.05;

      if (isListening) {
        if (currentVolume > threshold) {
          if (voiceStopTimerRef.current) {
            clearTimeout(voiceStopTimerRef.current);
            voiceStopTimerRef.current = null;
          }
          if (!isRecording && !voiceStartTimerRef.current) {
            voiceStartTimerRef.current = setTimeout(() => {
              startRecording();
              voiceStartTimerRef.current = null;
            }, VOICE_START_DEBOUNCE);
          }
        } else {
          if (voiceStartTimerRef.current) {
            clearTimeout(voiceStartTimerRef.current);
            voiceStartTimerRef.current = null;
          }
          if (isRecording && !voiceStopTimerRef.current) {
            voiceStopTimerRef.current = setTimeout(() => {
              stopRecording();
              voiceStopTimerRef.current = null;
            }, VOICE_STOP_DEBOUNCE);
          }
        }
      }
      animationIdRef.current = requestAnimationFrame(detectVoice);
    };

    const startRecording = () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "inactive"
      ) {
        mediaRecorderRef.current.start();
        setIsRecording(true);
      }
    };

    const stopRecording = () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    };

    initializeMedia().then(() => {
      if (isListening) {
        animationIdRef.current = requestAnimationFrame(detectVoice);
      }
    });

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (voiceStartTimerRef.current) {
        clearTimeout(voiceStartTimerRef.current);
      }
      if (voiceStopTimerRef.current) {
        clearTimeout(voiceStopTimerRef.current);
      }
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isListening, onRecordingComplete]);

  return { isRecording };
};

/* ---------- DiscussionPage 컴포넌트 ---------- */
export default function DiscussionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { topic, personas, roles } = location.state || {};

  const defaultRoles = { pro: ["User"], con: [] };
  const safeRoles = roles || defaultRoles;

  const [messages, setMessages] = useState([]);
  const [currentRound, setCurrentRound] = useState(1);
  const [turnOrder, setTurnOrder] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [isUserTurn, setIsUserTurn] = useState(false);
  const [allRoundsMessages, setAllRoundsMessages] = useState([]);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [isDiscussionActive, setIsDiscussionActive] = useState(true);
  const [round3OpponentMessage, setRound3OpponentMessage] = useState(null);
  const [isListening, setIsListening] = useState(false);

  const removeQuotes = (text) =>
    !text ? text : text.replace(/['"]/g, "").trim();
  const userStance = safeRoles.pro.includes("User") ? "찬성" : "반대";

  // STT 함수 (Placeholder - 실제 STT API로 대체 필요)
  const transcribeAudio = async (audioBlob) => {
    // TODO: 실제 STT API 호출로 대체
    // 예시:
    // const formData = new FormData();
    // formData.append("audio", audioBlob);
    // const response = await fetch("https://your-stt-api.com/transcribe", {
    //   method: "POST",
    //   body: formData,
    // });
    // const data = await response.json();
    // return data.text;
    // const audioFile = new File([audioBlob], `recording.${fileExtension}`);

    // Prepare form data for Whisper API request
    const formData = new FormData();
    formData.append("file", audioBlob);
    formData.append("model", "whisper-1");
    const response = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          // Note: No 'Content-Type' header; fetch will set the correct boundary for multipart/form-data
        },
        body: formData,
      }
    );
    if (!response.ok) {
      throw new Error(
        `Whisper API error: ${response.status} ${response.statusText}`
      );
    }
    const data = await response.json();
    return data.text;
  };

  const { isRecording } = useAudioRecorder(isListening, async (audioBlob) => {
    const text = await transcribeAudio(audioBlob);
    handleSend(text);
  });

  useEffect(() => {
    setIsListening(isUserTurn);
  }, [isUserTurn]);

  /* ---------- 라운드 1 초기 메시지 ---------- */
  useEffect(() => {
    if (!topic || !personas) return;

    const pros = safeRoles.pro.filter((p) => p !== "User");
    const cons = safeRoles.con.filter((p) => p !== "User");

    const firstSpeakers =
      userStance === "찬성" ? ["User", cons[0]] : [pros[0], "User"];
    setTurnOrder(firstSpeakers);

    const round2Order = [
      safeRoles.pro[1],
      safeRoles.con[1],
      safeRoles.pro[0],
      safeRoles.con[0],
      safeRoles.pro[1],
      safeRoles.con[1],
    ];

    const round3Order =
      userStance === "찬성"
        ? ["User", safeRoles.con[0]]
        : [safeRoles.pro[0], "User"];

    if (currentRound === 2) {
      setTurnOrder(round2Order);
    }

    if (currentRound === 3) {
      setTurnOrder(round3Order);
    }

    (async () => {
      if (currentRound !== 1 || currentTurn !== 0) return;
      const firstMsgs = [];

      for (const name of firstSpeakers) {
        if (name === "User") {
          firstMsgs.push({ sender: "User", content: null, stance: userStance });
          continue;
        }
        const stance = safeRoles.pro.includes(name) ? "찬성" : "반대";
        const sys = {
          role: "system",
          content:
            `당신은 ${name} MBTI 토론자입니다. 주제: "${topic}". ` +
            `${stance} 입장에서 ${name} MBTI 성향을 말투에 반영하여 한두 문장 첫 발언하되, 당신의 MBTI를 직접적으로 언급하는 답변은 하지마`,
        };
        const reply = await callOpenAI([sys]);
        firstMsgs.push({
          sender: name,
          content: removeQuotes(reply.content),
          stance,
          mbti: name,
        });
      }
      setAllRoundsMessages(firstMsgs);
    })();
  }, [topic, personas, safeRoles, currentRound]);

  /* ---------- 라운드 2·3 GPT 메시지 추가 ---------- */
  useEffect(() => {
    if (currentRound === 2 && !isUserTurn && isDiscussionActive) {
      (async () => {
        const newMsgs = await getMessages();
        if (newMsgs && newMsgs.length > 0) {
          if (currentTurn === 5) {
            const lastMessage = allRoundsMessages[allRoundsMessages.length - 1];
            if (lastMessage && lastMessage.content === newMsgs[0].content) {
              setCurrentRound(3);
              setCurrentTurn(0);
              const opponentMsg = await generateRound3OpponentMessage();
              setRound3OpponentMessage(opponentMsg);
              if (userStance === "찬성") {
                setIsUserTurn(true);
              } else {
                if (opponentMsg) {
                  setMessages((prev) => [...prev, opponentMsg]);
                  setAllRoundsMessages((prev) => [...prev, opponentMsg]);
                }
                setIsUserTurn(true);
              }
              return;
            }
          }

          setAllRoundsMessages((prev) => [...prev, ...newMsgs]);
          setMessages((prev) => [...prev, ...newMsgs]);

          if (currentTurn < 5) {
            advanceTurn({ 1: 2, 2: 6, 3: 2 });
          } else if (currentTurn === 5) {
            setCurrentRound(3);
            setCurrentTurn(0);
            const opponentMsg = await generateRound3OpponentMessage();
            setRound3OpponentMessage(opponentMsg);
            if (userStance === "찬성") {
              setIsUserTurn(true);
            } else {
              if (opponentMsg) {
                setMessages((prev) => [...prev, opponentMsg]);
                setAllRoundsMessages((prev) => [...prev, opponentMsg]);
              }
              setIsUserTurn(true);
            }
          }
        }
      })();
    }
  }, [
    currentRound,
    currentTurn,
    isUserTurn,
    isDiscussionActive,
    userStance,
    allRoundsMessages,
  ]);

  /* ---------- 라운드 3 상대방 메시지 생성 함수 ---------- */
  const generateRound3OpponentMessage = async () => {
    const messageTexts = allRoundsMessages
      .filter((msg) => msg && msg.content)
      .map((msg) => `${msg.content}`);

    const opponentName =
      userStance === "찬성" ? safeRoles.con[0] : safeRoles.pro[0];
    const opponentStance = userStance === "찬성" ? "반대" : "찬성";

    const prompt =
      `당신은 ${opponentName} MBTI 토론자입니다. 주제: "${topic}".\n\n` +
      `지금까지의 전체 토론 내용입니다:\n${messageTexts.join("\n")}\n\n` +
      `위의 모든 발언을 참고하여, ${opponentStance} 입장에서 최종 변론을 해주세요. ` +
      `지금까지의 토론을 종합하여 가장 강력한 주장을 펼쳐주세요. ` +
      `반드시 두 문장 이내로만 명료하게 답변해주세요. ` +
      `${opponentStance} 입장에서 ${opponentName} MBTI 성향을 말투에 반영하여 성격을 말투에 반영하되 MBTI를 직접적으로 언급하지는 마세요. ` +
      `반드시 존댓말을 사용해주세요.`;

    const reply = await callOpenAI([
      { role: "system", content: prompt },
      ...messageTexts.map((msg) => ({
        role: "user",
        content: msg,
      })),
    ]);

    if (reply && reply.content) {
      return {
        sender: opponentName,
        content: removeQuotes(reply.content),
        stance: opponentStance,
        mbti: opponentName,
      };
    }
    return null;
  };

  /* ---------- 메시지 한 개씩 출력 ---------- */
  useEffect(() => {
    const maxTurns = { 1: 2, 2: 6, 3: 2 };
    if (!isDiscussionActive || currentRound === 3) return;

    const roundStartIdx = { 1: 0, 2: 2, 3: 8 };
    const idx = roundStartIdx[currentRound] + currentTurn;

    const pros = safeRoles.pro.filter((p) => p !== "User");
    const cons = safeRoles.con.filter((p) => p !== "User");

    const round2Order = [
      safeRoles.pro[1],
      safeRoles.con[1],
      safeRoles.pro[0],
      safeRoles.con[0],
      safeRoles.pro[1],
      safeRoles.con[1],
    ];

    const round3Order =
      userStance === "찬성" ? ["User", safeRoles.con[0]] : [pros[0], "User"];

    const currentOrder =
      currentRound === 2
        ? round2Order
        : currentRound === 3
        ? round3Order
        : turnOrder;

    const isCurrentUserTurn = currentOrder[currentTurn] === "User";

    if (isCurrentUserTurn) {
      setIsUserTurn(true);
      return;
    }

    const timer = setTimeout(async () => {
      if (!allRoundsMessages[idx]) return;

      const msg = allRoundsMessages[idx];
      if (msg.sender === "User") {
        setIsUserTurn(true);
        return;
      }

      const isDuplicate = messages.some(
        (m) =>
          m.sender === msg.sender &&
          m.content === msg.content &&
          m.stance === msg.stance
      );

      if (!isDuplicate) {
        setMessages((prev) => [...prev, msg]);
      }

      advanceTurn(maxTurns);
    }, 2000);

    return () => clearTimeout(timer);
  }, [
    allRoundsMessages,
    currentTurn,
    currentRound,
    turnOrder,
    safeRoles,
    userStance,
    isDiscussionActive,
    messages,
  ]);

  const advanceTurn = (maxTurns) => {
    setCurrentTurn((prev) => {
      const nextTurn = prev + 1;
      if (currentRound === 1 && nextTurn === maxTurns[1]) {
        setCurrentRound(2);
        return 0;
      } else if (currentRound === 2 && nextTurn === maxTurns[2]) {
        setCurrentRound(3);
        return 0;
      }
      return nextTurn;
    });
  };

  /* ---------- 유저 전송 ---------- */
  const handleSend = (input) => {
    if (!input.trim() || !isDiscussionActive) return;
    const newMsg = { sender: "User", content: input, stance: userStance };

    setMessages((prev) => [...prev, newMsg]);
    setAllRoundsMessages((prev) => {
      const up = [...prev];
      const roundStartIdx = { 1: 0, 2: 2, 3: 8 };
      const idx = roundStartIdx[currentRound] + currentTurn;
      up[idx] = newMsg;
      return up;
    });

    setIsUserTurn(false);

    if (currentRound === 3) {
      if (userStance === "찬성" && round3OpponentMessage) {
        setMessages((prev) => [...prev, round3OpponentMessage]);
        setAllRoundsMessages((prev) => [...prev, round3OpponentMessage]);
      }
      setShowVoteModal(true);
      setIsDiscussionActive(false);
    } else {
      advanceTurn({ 1: 2, 2: 6, 3: 2 });
    }
  };

  /* ---------- GPT 메시지 생성 ---------- */
  const getMessages = async () => {
    if (currentRound === 3) return [];

    const pros = safeRoles.pro.filter((p) => p !== "User");
    const cons = safeRoles.con.filter((p) => p !== "User");

    const round2Order = [
      safeRoles.pro[1],
      safeRoles.con[1],
      safeRoles.pro[0],
      safeRoles.con[0],
      safeRoles.pro[1],
      safeRoles.con[1],
    ];

    const round3Order =
      userStance === "찬성" ? ["User", safeRoles.con[0]] : [pros[0], "User"];

    const currentOrder =
      currentRound === 2
        ? round2Order
        : currentRound === 3
        ? round3Order
        : turnOrder;

    const currentSpeaker = currentOrder[currentTurn];
    if (currentSpeaker === "User") {
      setIsUserTurn(true);
      return [];
    }

    const messages = [];
    let accumulatedMessages = [...allRoundsMessages];

    if (currentRound === 2) {
      const name = currentOrder[currentTurn];
      const stance = safeRoles.pro.includes(name) ? "찬성" : "반대";

      const messageHistory = accumulatedMessages
        .filter((msg) => msg && msg.content)
        .map((msg) => ({
          role: "user",
          content: msg.content,
        }));

      const previousSpeaker =
        currentTurn > 0 ? currentOrder[currentTurn - 1] : null;
      const previousMessage = previousSpeaker
        ? accumulatedMessages[accumulatedMessages.length - 1]
        : null;

      const prompt =
        `당신은 ${name} MBTI 토론자입니다. 주제: "${topic}".\n\n` +
        `직전 발언자(${previousSpeaker})의 메시지:\n` +
        `${previousMessage ? previousMessage.content : "첫 발언"}\n\n` +
        `${stance} 입장에서 대화해주세요. ` +
        `실제 사람이 대화하는 것처럼 자연스럽게 말해주세요.\n\n` +
        `답변은 두 문장으로 해주세요:\n` +
        `1. 첫 문장에서는 직전 발언자의 주장에 대한 반응을 보여주세요.\n` +
        `2. 두 번째 문장에서는 ${stance} 입장의 핵심 주장을 펼쳐주세요.\n\n` +
        `주의사항:\n` +
        `- 실제 사람이 대화하는 것처럼 자연스럽게 말해주세요.\n` +
        `- ${name} MBTI의 특성을 말투에 자연스럽게 반영해주세요.\n` +
        `- MBTI를 직접적으로 언급하지 말고, 대화체로만 말해주세요.\n` +
        `- 존댓말을 사용하되, 너무 격식적이지 않게 일상적인 대화체로 말해주세요.\n`;

      const reply = await callOpenAI([
        { role: "system", content: prompt },
        ...messageHistory,
      ]);

      if (!reply || !reply.content) return null;

      let content = removeQuotes(reply.content);
      try {
        const jsonMatch = content.match(/^\{.*\}$/s);
        if (jsonMatch) {
          const jsonContent = JSON.parse(jsonMatch[0]);
          if (jsonContent.content) content = jsonContent.content;
        }
      } catch (e) {
        console.log("응답이 JSON 형식이 아닙니다:", content);
      }

      content = content.replace(/^[^(]+\([^)]+\):\s*/g, "");

      const message = {
        sender: name,
        content: content,
        stance,
        mbti: name,
      };

      messages.push(message);
      return messages;
    } else {
      for (const name of currentOrder) {
        const stance = safeRoles.pro.includes(name) ? "찬성" : "반대";

        const prompt =
          `당신은 ${name} MBTI 토론자입니다. 주제: "${topic}". ` +
          `${stance} 입장에서 ${name} MBTI 성향을 말투에 반영하여 첫 발언해주세요. ` +
          `반드시 두 문장 이내로만 명료하게 답변해주세요. ` +
          `MBTI를 직접 언급하지는 마세요. ` +
          `반드시 존댓말을 사용해주세요.`;

        const reply = await callOpenAI([{ role: "system", content: prompt }]);

        if (!reply || !reply.content) return null;

        messages.push({
          sender: name,
          content: removeQuotes(reply.content),
          stance,
          mbti: name,
        });
      }
      return messages;
    }
  };

  const roundLabels = {
    1: "🗣️ 입론 : 나의 첫 주장을 펼쳐요",
    2: "🔄 반론 : 상대 의견에 반박해요",
    3: "🎯 최종 변론 : 내 입장을 정리해요",
  };

  /* ---------- 렌더 ---------- */
  return (
    <PageContainer>
      <Header>📢 토론 주제: "{topic}"</Header>
      <RoundIndicator>{roundLabels[currentRound]}</RoundIndicator>

      <ChatArea>
        {messages.map((m, i) => (
          <Message key={i} isUser={m.sender === "User"} {...m} />
        ))}
      </ChatArea>

      {isUserTurn && (
        <InputArea>
          {isRecording ? (
            <div>녹음 중...</div>
          ) : (
            <div>말씀을 기다리는 중...</div>
          )}
        </InputArea>
      )}

      <Modal
        isOpen={showVoteModal}
        onRequestClose={() => setShowVoteModal(false)}
        style={{
          content: {
            inset: "40% auto auto 50%",
            transform: "translate(-50%,-50%)",
            width: 500,
            borderRadius: 14,
            padding: "32px 40px",
            textAlign: "center",
          },
          overlay: { backgroundColor: "rgba(0,0,0,0.45)" },
        }}
      >
        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>
          🗳️ 토론 이후, 입장 변화에 대해 투표해 주세요
        </h2>
        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <button
            onClick={() => {
              setShowVoteModal(false);
              setShowEndModal(true);
            }}
            style={{
              padding: "10px 28px",
              background: "#4caf50",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 20,
              cursor: "pointer",
            }}
          >
            찬성
          </button>
          <button
            onClick={() => {
              setShowVoteModal(false);
              setShowEndModal(true);
            }}
            style={{
              padding: "10px 28px",
              background: "#f44336",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 20,
              cursor: "pointer",
            }}
          >
            반대
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={showEndModal}
        onRequestClose={() => setShowEndModal(false)}
        style={{
          content: {
            inset: "40% auto auto 50%",
            transform: "translate(-50%,-50%)",
            width: 420,
            borderRadius: 14,
            padding: "32px 40px",
            textAlign: "center",
          },
          overlay: { backgroundColor: "rgba(0,0,0,0.45)" },
        }}
      >
        <h3
          style={{
            fontSize: 30,
            fontWeight: 800,
            color: "#000000",
            marginBottom: 10,
          }}
        >
          🗳️ 투표 결과 🗳️
        </h3>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>
          찬성 : 3표, 반대 : 1표
        </h2>
        <p style={{ marginBottom: 32, fontSize: 18 }}>
          새로운 토론을 시작하시겠습니까?
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
          <button
            onClick={() => navigate("/")}
            style={{
              padding: "10px 28px",
              background: "#6c63ff",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 20,
              cursor: "pointer",
            }}
          >
            예
          </button>
          <button
            onClick={() => setShowEndModal(false)}
            style={{
              padding: "10px 28px",
              background: "#e0e0e0",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 20,
              cursor: "pointer",
            }}
          >
            아니오
          </button>
        </div>
      </Modal>
    </PageContainer>
  );
}

/* ---------- 말풍선 + 프로필 ---------- */
const Message = ({ isUser, sender, content, stance, mbti }) => {
  const profileImg = allPersonasMap[mbti || sender] || user;
  return (
    <MessageContainer $isUser={isUser}>
      {!isUser && (
        <ProfileBox>
          <ProfileImg src={profileImg} alt={mbti || sender} />
          <MBTILabel>{mbti || sender}</MBTILabel>
        </ProfileBox>
      )}
      <Bubble $isUser={isUser}>
        <Text>{content}</Text>
        <StanceTag $isPro={stance === "찬성"}>{stance}</StanceTag>
      </Bubble>
    </MessageContainer>
  );
};

/* ---------- styled-components ---------- */
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
`;

const Header = styled.div`
  font-size: 40px;
  font-weight: 800;
  margin: 30px 0;
  color: #000000;
  background-color: #ffffff;
  display: flex;
  justify-content: center;
`;

const RoundIndicator = styled.div`
  font-size: 30px;
  font-weight: 700;
  padding-top: 20px;
  padding-bottom: 20px;
  color: #ffffff;
  background-color: #000000;
  display: flex;
  justify-content: center;
`;

const ChatArea = styled.div`
  flex: 1;
  background: #dfdfdf;
  overflow-y: auto;
  padding: 20px 30px;
`;

const InputArea = styled.div`
  display: flex;
  gap: 20px;
  padding: 20px 30px;
`;

const MessageContainer = styled.div`
  display: flex;
  flex-direction: ${({ $isUser }) => ($isUser ? "row-reverse" : "row")};
  align-items: center;
  margin: 10px 30px;
`;

const ProfileBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const MBTILabel = styled.div`
  margin-top: 4px;
  font-size: 20px;
  font-weight: 800;
`;

const ProfileImg = styled.img`
  width: 70px;
  height: 70px;
  border-radius: 50%;
  margin: 0 10px;
`;

const Bubble = styled.div`
  max-width: 50%;
  background: ${({ $isUser }) => ($isUser ? "#000" : "#f1f1f1")};
  color: ${({ $isUser }) => ($isUser ? "#fff" : "#000")};
  padding: 14px 20px;
  border-radius: 20px;
  font-size: 20px;
`;

const Text = styled.div`
  white-space: pre-line;
`;

const StanceTag = styled.div`
  font-size: 15px;
  margin-top: 6px;
  text-align: right;
  color: ${({ $isPro }) => ($isPro ? "#4caf50" : "#f44336")};
  font-weight: 800;
`;
