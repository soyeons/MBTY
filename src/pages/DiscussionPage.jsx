import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

// assets - MBTI 이미지
import isfj from '../assets/ISFJ.png';
import entj from '../assets/ENTJ.png';
import istp from '../assets/ISTP.png';
import estj from '../assets/ESTJ.png';
import enfp from '../assets/ENFP.png';
import infj from '../assets/INFJ.png';
import estp from '../assets/ESTP.png';
import enfj from '../assets/ENFJ.png';
import istj from '../assets/ISTJ.png';
import intj from '../assets/INTJ.png';
import intp from '../assets/INTP.png';
import infp from '../assets/INFP.png';
import esfp from '../assets/ESFP.png';
import esfj from '../assets/ESFJ.png';
import isfp from '../assets/ISFP.png';
import entp from '../assets/ENTP.png';
import user from '../assets/user.png';

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

async function callOpenAI(messages) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages,
      max_tokens: 300,
    }),
  });
  const data = await res.json();
  return data.choices[0].message;
}

export default function DiscussionPage() {
  const location = useLocation();
  const { topic, personas, roles } = location.state || {};

  // roles가 없을 경우 기본값 설정
  const defaultRoles = {
    pro: ['User'],
    con: []
  };
  const safeRoles = roles || defaultRoles;

  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [currentRound, setCurrentRound] = useState(1);
  const [turnOrder, setTurnOrder] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [isUserTurn, setIsUserTurn] = useState(false);
  const [allRoundsMessages, setAllRoundsMessages] = useState([]);

  const userStance = safeRoles.pro.includes('User') ? '찬성' : '반대';

  // 초기 메시지 생성 및 턴 순서 설정
  useEffect(() => {
    if (!topic || !personas) return;

    const turnOrderTemp = [];

    const pros = safeRoles.pro.filter(p => p !== 'User');
    const cons = safeRoles.con.filter(p => p !== 'User');

    turnOrderTemp[0] = pros[0];
    turnOrderTemp[1] = cons[0];
    turnOrderTemp[2] = userStance === '찬성' ? 'User' : pros[1];
    turnOrderTemp[3] = userStance === '반대' ? 'User' : cons[1];

    setTurnOrder(turnOrderTemp);

    (async () => {
      const tempMessages = [];

      if(currentRound === 1 && currentTurn === 0) {
        // 라운드 1: 첫 발언
        for (const name of turnOrderTemp) {
          if (name === 'User') {
            tempMessages.push({ sender: 'User', content: null, stance: userStance });
            continue;
          }

          console.log(`(round1) ${name} 발언 생성중`);

          const stance = safeRoles.pro.includes(name) ? '찬성' : '반대';
          const systemMsg = {
            role: 'system',
            content: `당신은 ${name} MBTI를 가진 토론 참가자입니다. 주제: "${topic}". ` +
                    `${stance} 입장에서, MBTI 성격을 반영해 한두문장으로 첫 발언을 하세요.`,
          };

          const reply = await callOpenAI([systemMsg]);
          tempMessages.push({ sender: name, content: reply.content, stance });
        }

        setAllRoundsMessages(tempMessages);
      }
      
    })();
  }, [topic, personas, safeRoles]);

  // 라운드 변경 시 메시지 설정
  useEffect(() => {
    if ((currentRound === 2 || currentRound === 3) && currentTurn === 0) {
      (async () => {
        const newMessages = await getMessages();
        setAllRoundsMessages(prevMessages => [...prevMessages, ...newMessages]);
      })();
    }
  }, [currentRound, currentTurn]);

  // 하나씩 메시지를 보여주기 위한 효과
  useEffect(() => {
    console.log(`(현재 라운드) ${currentRound} (현재 턴) ${currentTurn} / (누적 메시지) 아래 표시:`);
    
    // 라운드별 최대 턴 수 계산
    const maxTurns = {
      1: 4,
      2: 8,
      3: 12
    };
    
    // 라운드 3의 마지막 턴이면 종료
    if(currentRound === 3 && currentTurn === maxTurns[3]) {
      setIsUserTurn(false); // 더 이상의 유저 입력을 받지 않음
      return;
    }

    console.log(allRoundsMessages);

    // 현재 라운드의 시작 인덱스 계산
    const roundStartIndex = {
      1: 0,
      2: 4,
      3: 8
    };

    const currentIndex = roundStartIndex[currentRound] + currentTurn;
    if (allRoundsMessages.length === 0 || currentIndex >= allRoundsMessages.length) return;

    const msg = allRoundsMessages[currentIndex];
    if (msg.sender === 'User') {
      setIsUserTurn(true);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        // 현재 턴의 메시지가 없으면 생성
        if (!msg.content) {
          const newMessages = await getMessages();
          const newMsg = newMessages.find(m => m.sender === msg.sender);
          if (newMsg) {
            setAllRoundsMessages(prev => {
              const updated = [...prev];
              updated[currentIndex] = newMsg;
              return updated;
            });
            setMessages(prev => [...prev, newMsg]);
          }
        } else {
          setMessages(prev => [...prev, msg]);
        }
        
        setCurrentTurn(prev => prev + 1);

        // 라운드 전환 로직
        if (currentRound === 1 && currentTurn === maxTurns[1] - 1) {
          console.log('라운드 1 종료, 라운드 2로 전환');
          setTimeout(() => {
            setCurrentRound(2);
            setCurrentTurn(0);
          }, 0);
        } else if (currentRound === 2 && currentTurn === 3) { // 라운드 2는 4턴만 진행
          console.log('라운드 2 종료, 라운드 3로 전환');
          setTimeout(() => {
            setCurrentRound(3);
            setCurrentTurn(0);
          }, 0);
        }
      } catch (error) {
        console.error('메시지 처리 중 오류 발생:', error);
        // 오류 발생 시 다음 턴으로 넘어가도록 설정
        setCurrentTurn(prev => prev + 1);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [allRoundsMessages, currentTurn, currentRound]);

  const handleSend = () => {
    if (!userInput.trim()) return;

    const newMsg = { sender: 'User', content: userInput, stance: userStance };
    setMessages(prev => [...prev, newMsg]);

    setAllRoundsMessages(prev => {
      const updated = [...prev];
      updated[currentTurn] = newMsg;
      return updated;
    });

    setUserInput('');
    setIsUserTurn(false);

    if(currentRound === 1 && currentTurn === 3) {
      console.log('라운드 1 종료, 라운드 2로 전환');
      setCurrentRound(2);
      setCurrentTurn(0);
    } else if(currentRound === 2 && currentTurn === 3) { // 라운드 2는 4턴만 진행
      console.log('라운드 2 종료, 라운드 3로 전환');
      setCurrentRound(3);
      setCurrentTurn(0);
    } else {
      setCurrentTurn(prev => prev + 1);
    }
  };

  // 라운드 2와 3의 GPT 호출 시 반론, 보완, 요약을 유도하는 프롬프트
  const getMessages = () => {
    // 이전 라운드의 메시지만 따로 필터링
    const previousRoundMessages = allRoundsMessages.slice(0, currentRound === 2 ? 4 : 8).map(msg => ({
      role: msg.sender === 'User' ? 'user' : 'assistant',
      content: msg.content,
    }));
  
    const roundMessages = turnOrder.map(async (name) => {
      const stance = safeRoles.pro.includes(name) ? '찬성' : '반대';

      let apiMsgs;

      if(currentRound === 2) {
        console.log(`(round2) ${name} 발언 생성중`);
  
        const systemMsg = {
          role: 'user',
          content: `당신은 ${name} MBTI를 가진 토론 참가자입니다. 주제: "${topic}"에 대해 토론 중입니다. ` +
                  `다음은 Round 1에서 나눈 참가자들의 발언입니다. 이 중 하나의 의견을 언급하며 ` +
                  `당신의 ${stance} 입장을 더욱 강력하게 주장해주세요. ` +
                  `두 문장 이내로 답하고, MBTI 성격을 반영해주세요.`,
        };
    
        apiMsgs = [...previousRoundMessages, systemMsg];
  
      } else if (currentRound === 3) {
        console.log(`(round3) ${name} 발언 생성중`);
  
        const systemMsg = {
          role: 'user',
          content: `당신은 ${name} MBTI를 가진 토론 참가자입니다. 주제: "${topic}"에 대한 토론의 최종 발언을 하셔야 합니다. ` +
                  `지금까지 나온 모든 의견들을 검토한 후, ` +
                  `당신의 MBTI 성격(${name})에 맞는 말투와 태도로, ${stance} 입장을 확고히 두 문장 정도로 간단명료하게 주장하세요.`,
        };
    
        apiMsgs = [...previousRoundMessages, systemMsg];
      }
  
      const reply = await callOpenAI(apiMsgs);
      return { sender: name, content: reply.content, stance };
    });
  
    return Promise.all(roundMessages);
  };

  return (
    <PageContainer>
      <Header>📢 토론 주제: "{topic}"</Header>
      <RoundIndicator>
        {currentRound === 2 ? '현재 라운드: 2 - 마지막 발언' : 
         currentRound === 3 ? '현재 라운드: 3 - 최종 발언' : 
         `현재 라운드: ${currentRound}`}
      </RoundIndicator>
      <ChatArea>
        {messages.map((msg, idx) => (
          // <Message key={idx} isUser={msg.sender === 'User'}>
          //   <strong>{msg.sender} ({msg.stance}):</strong> {msg.content}
          // </Message>
          <Message
            key={idx}
            isUser={msg.sender === 'User'}
            sender={msg.sender}
            content={msg.content}
            stance={msg.stance}
          />
        ))}
      </ChatArea>
      {isUserTurn && (
        <InputArea>
          <TextInput
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="당신의 차례입니다. 논리정연하게 한두 문장으로 발언해 주세요."
          />
          <SendButton onClick={handleSend}>전송</SendButton>
        </InputArea>
      )}
    </PageContainer>
  );
}

// 말풍선 + 프로필 컴포넌트
const Message = ({ isUser, sender, content, stance }) => {
  const profileImg = allPersonasMap[sender] || user;

  return (
    <MessageContainer isUser={isUser}>
      {!isUser && (
        <ProfileBox>
          <ProfileImg src={profileImg} alt={sender} />
          <MBTILabel>{sender}</MBTILabel>
        </ProfileBox>
      )}
      <Bubble isUser={isUser}>
        <Text>{content}</Text>
        <StanceTag isPro={stance === '찬성'}>{stance}</StanceTag>
      </Bubble>
      {isUser && (
        <ProfileBox>
          <ProfileImg src={profileImg} alt="User" />
          <MBTILabel>{sender}</MBTILabel>
        </ProfileBox>
      )}
    </MessageContainer>
  );
};

// 스타일 컴포넌트
const PageContainer = styled.div`
  display: flex;
  //background-color: pink;
  flex-direction: column;
  height: 100vh;
  //padding: 20px;
`;
const Header = styled.div`
  font-size: 40px;
  font-weight: 800;
  margin-top: 30px;
  margin-bottom: 30px;
  //background-color: green;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const RoundIndicator = styled.div`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 10px;
  margin-top: 10px;
  color: #555;
  margin-left: 30px;
  //background-color: yellow;
`;
const ChatArea = styled.div`
  flex: 1;
  //overflow-y: auto;
  //margin-bottom: 16px;
  background-color: #dfdfdf;
`;
// const Message = styled.div
//   ${({ isUser }) => isUser && 'text-align: right;'}
//   //background-color: grey;
//   font-size: 24px;
//   //margin-left: 50px;
// ;
const InputArea = styled.div`
  display: flex;
  gap: 20px;
  //background-color: orange;
  margin: 30px;
`;
const TextInput = styled.input`
  flex: 1;
  padding: 8px;
  font-size: 16px;
`;
const SendButton = styled.button`
  padding: 8px 16px;
  font-size: 16px;
  background: #6c63ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

const MessageContainer = styled.div`
  display: flex;
  flex-direction: ${({ isUser }) => (isUser ? 'row-reverse' : 'row')};
  align-items: center;
  justify-content: flex-start;
  margin: 10px 30px;
  //background-color: pink;
`;

const ProfileBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  //background-color: yellow;
`;

const MBTILabel = styled.div`
  margin-top: 4px;
  font-size: 20px;
  font-weight: 800;
  color: #000000;
`;

const ProfileImg = styled.img`
  width: 70px;
  height: 70px;
  border-radius: 50%;
  //object-fit: cover;
  margin: 0 10px;
`;

const Bubble = styled.div`
  max-width: 50%;
  background-color: ${({ isUser }) => (isUser ? '#000000' : '#f1f1f1')};
  color: ${({ isUser }) => (isUser ? '#fff' : '#000')};
  padding: 14px 20px;
  border-radius: 20px;
  font-size: 20px;
  position: relative;
`;

const Text = styled.div`
  white-space: pre-line;
`;

const StanceTag = styled.div`
  font-size: 15px;
  margin-top: 6px;
  text-align: right;
  color: ${({ isPro }) => (isPro ? '#4caf50' : '#f44336')};
  font-weight: 800;
`;