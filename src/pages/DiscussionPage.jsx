import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

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

  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [currentRound, setCurrentRound] = useState(1);
  const [turnOrder, setTurnOrder] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [isUserTurn, setIsUserTurn] = useState(false);
  const [allRoundsMessages, setAllRoundsMessages] = useState([]);

  const userStance = roles.pro.includes('User') ? '찬성' : '반대';

  // 초기 메시지 생성 및 턴 순서 설정
  useEffect(() => {
    if (!topic || !personas) return;

    // const userIndexInOrder = userStance === '찬성' ? 2 : 3;
    const turnOrderTemp = [];

    const pros = roles.pro.filter(p => p !== 'User');
    const cons = roles.con.filter(p => p !== 'User');

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

          const stance = roles.pro.includes(name) ? '찬성' : '반대';
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
  }, [topic, personas, roles]);

  // 하나씩 메시지를 보여주기 위한 효과
  useEffect(() => {

    console.log(`(현재 라운드) ${currentRound} (현재 턴) ${currentTurn} / (누적 메시지) 아래 표시:`);
    if(currentRound === 2 && currentTurn === 8) return;

    console.log(allRoundsMessages);

    if (allRoundsMessages.length === 0 || currentTurn >= allRoundsMessages.length) return;

    const msg = allRoundsMessages[currentTurn];
    if (msg.sender === 'User') {
      setIsUserTurn(true);
      return;
    }

    const timer = setTimeout(() => {
      setMessages(prev => [...prev, msg]);
      
      setCurrentTurn(prev => prev + 1);
    
      // 마지막 턴이면 라운드 2로 전환
      if (currentTurn === 3) {
        setTimeout(() => {
          setCurrentRound(2);
          setCurrentTurn(0);
        }, 0);
      }
    }, 2000);
    

    return () => clearTimeout(timer);
  }, [allRoundsMessages, currentTurn]);

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
      setCurrentRound(2);
      setCurrentTurn(0);
    }
    else{
      setCurrentTurn(prev => prev + 1);
    }
  };

  // 라운드 2 GPT 호출 시 반론, 보완, 요약을 유도하는 프롬프트
  const getRound2Messages = () => {

    // Round 1 메시지만 따로 필터링
    const round1OnlyMessages = allRoundsMessages.slice(0, 4).map(msg => ({
      role: msg.sender === 'User' ? 'user' : 'assistant',
      content: msg.content,
    }));
  
    const round2Messages = turnOrder.map(async (name) => {
      const stance = roles.pro.includes(name) ? '찬성' : '반대';
  
      console.log(`(round2) ${name} 발언 생성중`);
  
      const systemMsg = {
        role: 'user',
        content: `당신은 ${name} MBTI를 가진 토론 참가자입니다. 주제: "${topic}"에 대해 토론 중입니다. ` +
                 `다음은 Round 1에서 나눈 참가자들의 발언입니다. 이를 참고해 ` +
                 `당신의 ${stance} 입장을 보완하거나 반박하거나 요약해보세요. ` +
                 `두 문장 이내로 답하고, MBTI 성격을 반영해주세요.`,
      };
  
      const apiMsgs = [...round1OnlyMessages, systemMsg];

      // console.log("apiMsg 찍어보기");
      // console.log(apiMsgs);


      setCurrentTurn(prev => prev + 1);
  
      const reply = await callOpenAI(apiMsgs);
      return { sender: name, content: reply.content, stance };
    });
  
    return Promise.all(round2Messages);
  };
  
  

  // 라운드 변경 시 메시지 설정
  useEffect(() => {
    if (currentRound === 2 && currentTurn === 0) {
      (async () => {
        const round2Messages = await getRound2Messages();
        setAllRoundsMessages(prevMessages => [...prevMessages, ...round2Messages]);
      })();
    }
  }, [currentRound, currentTurn]);

  return (
    <PageContainer>
      <Header>토론 주제: “{topic}”</Header>
      <RoundIndicator>
        {currentRound === 2 ? '현재 라운드: 2 - 마지막 발언' : `현재 라운드: ${currentRound}`}
      </RoundIndicator>
      <ChatArea>
        {messages.map((msg, idx) => (
          <Message key={idx} isUser={msg.sender === 'User'}>
            <strong>{msg.sender} ({msg.stance}):</strong> {msg.content}
          </Message>
        ))}
      </ChatArea>
      {isUserTurn && (
        <InputArea>
          <TextInput
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="당신의 차례입니다. 논리정연하게 한두문장으로 발언해주세요."
          />
          <SendButton onClick={handleSend}>전송</SendButton>
        </InputArea>
      )}
    </PageContainer>
  );
}

// 스타일 컴포넌트
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 20px;
`;
const Header = styled.h1`
  font-size: 24px;
  margin-bottom: 16px;
`;
const RoundIndicator = styled.div`
  font-size: 18px;
  margin-bottom: 10px;
  color: #555;
`;
const ChatArea = styled.div`
  flex: 1;
  overflow-y: auto;
  margin-bottom: 16px;
`;
const Message = styled.div`
  margin: 4px 0;
  ${({ isUser }) => isUser && 'text-align: right;'}
`;
const InputArea = styled.div`
  position: absolute;
  bottom: 10vh;
`;
const TextInput = styled.input`
  flex: 1;
  width: 90vw;
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
  width: 5vw;
`;
