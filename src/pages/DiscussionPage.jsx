import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';  // useLocation 임포트
import styled from 'styled-components';
// OpenAI 호출용, env 파일에서 가져오기
const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

console.log('OPENAI_APIKEY:', OPENAI_API_KEY);

async function callOpenAI(messages) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: 300,
    }),
  });
  const data = await res.json();
  return data.choices[0].message;
}

export default function DiscussionPage() {
  const location = useLocation();  // useLocation 훅을 사용하여 location 가져오기
  const { topic, personas, roles } = location.state || {};  // state로 전달된 topic, personas, roles 받기

  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');

  // 각 에이전트의 첫 발언 호출
  useEffect(() => {
    if (!topic || !personas) return;

    (async () => {
      const initMessages = [];
      for (const p of personas) {

        // 시스템 프롬프트
        const systemMsg = {
          role: 'system',
          content: `당신은 ${p} MBTI 를 가진 토론 참가자 입니다. ` +
                    `토론 주제는 다음과 같습니다: ${topic} ` +
                   `${roles.pro.includes(p) ? '찬성' : '반대'} 입장으로 답변하되, 자신의 MBTI 특성을 말투와 태도에 반영하여 간단하고 명료하게 첫 발언을 하시오.`
                   
        };

        const reply = await callOpenAI([systemMsg]);
        initMessages.push({ sender: p, content: reply.content });
      }
      console.log(initMessages);
      setMessages(initMessages);
    })();
  }, [topic, personas, roles]);

  // 사용자 메시지 및 에이전트 응답
  const handleSend = async () => {
    if (!userInput.trim()) return;

    // 유저 메시지 추가
    const newUserMsg = { sender: 'User', content: userInput };
    const history = [...messages, newUserMsg];
    setMessages(history);
    setUserInput('');

    // 모든 에이전트에게 재호출
    const nextMessages = [...history]; // 계속된 대화 이력을 포함하여 처리
    for (const p of personas) {
      const systemMsg = {
        role: 'system',
        content: `당신은 ${p} MBTI 를 가진 토론 참가자입니다. ` +
                 `${roles.pro.includes(p) ? '찬성' : '반대'} 입장에서, ` +
                 `답변할 때는 자신의 초기 주장(첫 발언)을 강조하고, 상대방을 설득하려는 태도를 유지하십시오.`,
      };

      // GPT 호출에 사용할 메시지 배열 구성
      const apiMsgs = [systemMsg, ...history.map(msg => ({
        role: msg.sender === 'User' ? 'user' : 'assistant',
        content: msg.content,
      }))];

      const reply = await callOpenAI(apiMsgs);
      nextMessages.push({ sender: p, content: reply.content });
    }

    setMessages(nextMessages);
  };

  return (
    <PageContainer>
      <Header>토론 주제: “{topic}”</Header>
      <ChatArea>
        {messages.map((msg, idx) => (
          <Message key={idx} isUser={msg.sender === 'User'}>
            <strong>{msg.sender}:</strong> {msg.content}
          </Message>
        ))}
      </ChatArea>
      <InputArea>
        <TextInput
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="메시지를 입력하세요"
        />
        <SendButton onClick={handleSend}>전송</SendButton>
      </InputArea>
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
  display: flex;
  gap: 8px;
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
