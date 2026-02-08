import { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle, Bot, User } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface ChatSidebarProps {
  onClose: () => void;
}

// Hardcoded Q&A database
const qaDatabase: Record<string, string> = {
  'what is neurosim': 'NeuroSim is an AI-powered stroke decision support system that helps clinicians evaluate treatment options for acute ischemic stroke patients.',
  'what is stroke': 'Stroke is a medical emergency that occurs when blood flow to the brain is interrupted, either by a blocked artery (ischemic) or burst blood vessel (hemorrhagic).',
  'what is ivt': 'IVT (Intravenous Thrombolysis) is a treatment using clot-busting medication like alteplase or tenecteplase given through an IV. It must be administered within 4.5 hours of stroke onset.',
  'what is evt': 'EVT (Endovascular Therapy) is a procedure where a catheter is used to physically remove the blood clot from the brain. It can be performed up to 24 hours after onset in selected patients.',
  'what is core volume': 'Core volume represents the irreversibly damaged brain tissue. If the core is too large (>70cc), the risk of treatment may outweigh the benefits.',
  'what is penumbra': 'Penumbra is the brain tissue that is at risk but still salvageable if blood flow is restored quickly. It surrounds the core infarct.',
  'how is nihss calculated': 'NIHSS (National Institutes of Health Stroke Scale) ranges from 0-42, assessing consciousness, gaze, visual fields, facial palsy, motor function, sensory, language, and neglect. Higher scores indicate more severe stroke.',
  'what are collaterals': 'Collateral circulation refers to alternative blood vessels that can supply blood to the brain when the main artery is blocked. Good collaterals (grades 2-3) help maintain penumbra longer.',
  'time window for treatment': 'IVT: 4.5 hours from onset. EVT: Up to 6 hours for standard cases, up to 24 hours for selected patients with favorable perfusion imaging.',
  'what does this patient need': 'Based on the current data, evaluate: Time since onset, Core volume, Collateral status, and NIHSS to determine if the patient is a candidate for IVT, EVT, both, or supportive care only.',
  'risks of treatment': 'IVT risks include symptomatic intracranial hemorrhage (sICH) in 5-7% of cases. EVT risks include vessel perforation, distal embolization, and procedural complications.',
  'benefits of treatment': 'IVT can improve outcomes by 30% if given early. EVT can achieve functional independence (mRS 0-2) in 45-70% of eligible patients, compared to 15-20% without treatment.',
  // Clinical questions for Routing Scenario Patient (Robert Chen - NS-2026-0042)
  'what is the nihss score': 'The patient has an NIHSS score of 18, indicating severe stroke with significant neurological deficits.',
  'how severe is the stroke': 'This is a severe stroke (NIHSS 18) with Left M1 occlusion. The patient has moderate collaterals (score 1.5) which provides some protection to the penumbra.',
  'what is the core volume': 'Initial core volume is 25cc, which is relatively small and favorable for intervention. The territory at risk is 150cc, indicating substantial salvageable tissue.',
  'is the patient eligible for ivt': 'Yes, the patient is within the 4.5-hour window (2h 14m since onset). However, with severe stroke (NIHSS 18) and Left M1 occlusion, EVT may provide better outcomes.',
  'should we do drip and ship or direct mothership': 'With NIHSS 18 and moderate collaterals (1.5), this patient would likely benefit from Direct Mothership approach to minimize time to EVT, given the large territory at risk (150cc).',
  'what is the blood pressure': 'Systolic BP is 150 mmHg. This is acceptable for thrombolysis if no other contraindications exist.',
  'how much time has passed': '2 hours and 14 minutes since symptom onset. Still well within treatment windows for both IVT and EVT.',
  'what is the occlusion location': 'Left Middle Cerebral Artery (M1 segment). This is a large vessel occlusion requiring EVT for optimal outcomes.',
  'are the collaterals good': 'Collateral score is 1.5 (moderate). This provides some time buffer but not as much as good collaterals (grade 2-3). Time is still critical.',
  'what is the penumbra size': 'Penumbra is approximately 125cc (territory at risk 150cc minus core 25cc). This represents substantial salvageable tissue if reperfusion is achieved quickly.',
  'is this patient a good candidate for evt': 'Yes. With NIHSS 18, Left M1 occlusion, small core (25cc), and large penumbra (125cc), this patient is an excellent candidate for EVT.',
  'what are the chances of good outcome': 'With current parameters and moderate collaterals, achieving mRS 0-2 depends heavily on time to reperfusion. Direct Mothership may offer better outcomes than Drip-and-Ship for this severe case.',
  // Advanced Clinical Questions for Routing Scenario Patient
  'is this occlusion likely to require multiple thrombectomy passes': 'The occlusion location favors efficient reperfusion. Distal M1 occlusions are generally associated with high first-pass success using contemporary stent-retriever or aspiration techniques, and there are no features here suggesting a complex or resistant clot. A single-pass reperfusion is therefore the most likely procedural course.',
  'do collateral pathways suggest leptomeningeal or pial dominance': 'Collateral support appears limited rather than robust. A collateral score of 1.5 reflects incomplete leptomeningeal filling, and the presence of a measurable infarct core at just over two hours from onset suggests that collateral flow has been insufficient to fully sustain the affected territory. This pattern is not consistent with true pial dominance.',
  'does clot burden suggest an embolic or in-situ thrombotic process': 'The presentation is most consistent with an embolic occlusion. The abrupt onset, distal M1 location, and absence of preceding transient ischemic symptoms favor an embolic mechanism. In contrast, in-situ thrombosis related to intracranial atherosclerosis typically shows better collateral development due to chronic vascular adaptation.',
  'are deep structures involved that increase edema vulnerability': 'Deep perforator territory involvement is highly likely. An M1 occlusion compromises lenticulostriate flow to the basal ganglia and internal capsule, and the observed core volume is consistent with early infarction in these regions. Infarcts involving deep gray matter are associated with a higher risk of malignant edema compared with isolated cortical involvement.',
  'would this patient tolerate even brief hypotension during evt': 'This patient is unlikely to tolerate hypotension during the procedure. With only moderate collateral support, penumbral perfusion is highly dependent on systemic blood pressure to maintain flow across high-resistance collateral pathways. Even short periods of reduced systolic pressure could precipitate rapid infarct expansion.',
};

function findBestAnswer(question: string): string {
  const normalizedQuestion = question.toLowerCase().trim();
  
  // Check for exact match
  if (qaDatabase[normalizedQuestion]) {
    return qaDatabase[normalizedQuestion];
  }
  
  // Check for partial matches
  for (const [key, answer] of Object.entries(qaDatabase)) {
    if (normalizedQuestion.includes(key) || key.includes(normalizedQuestion)) {
      return answer;
    }
  }
  
  // Check for keywords
  const keywords = [
    { words: ['ivt', 'thrombolysis', 'alteplase', 'tenecteplase'], answer: qaDatabase['what is ivt'] },
    { words: ['evt', 'endovascular', 'thrombectomy', 'clot removal'], answer: qaDatabase['what is evt'] },
    { words: ['core', 'infarct'], answer: qaDatabase['what is core volume'] },
    { words: ['penumbra', 'salvageable'], answer: qaDatabase['what is penumbra'] },
    { words: ['nihss', 'stroke scale'], answer: qaDatabase['how is nihss calculated'] },
    { words: ['collateral', 'circulation'], answer: qaDatabase['what are collaterals'] },
    { words: ['time', 'window', 'hours'], answer: qaDatabase['time window for treatment'] },
    { words: ['risk', 'bleeding', 'hemorrhage'], answer: qaDatabase['risks of treatment'] },
    { words: ['benefit', 'outcome', 'improve'], answer: qaDatabase['benefits of treatment'] },
    // Keywords for Routing Scenario Patient
    { words: ['nihss score', 'severity', 'how bad'], answer: qaDatabase['what is the nihss score'] },
    { words: ['core volume', 'core size', 'infarct volume'], answer: qaDatabase['what is the core volume'] },
    { words: ['eligible', 'candidate', 'can we treat'], answer: qaDatabase['is the patient eligible for ivt'] },
    { words: ['drip and ship', 'direct mothership', 'routing', 'transfer'], answer: qaDatabase['should we do drip and ship or direct mothership'] },
    { words: ['blood pressure', 'bp', 'hypertension'], answer: qaDatabase['what is the blood pressure'] },
    { words: ['time passed', 'onset time', 'how long', 'when started'], answer: qaDatabase['how much time has passed'] },
    { words: ['occlusion', 'blocked artery', 'clot location'], answer: qaDatabase['what is the occlusion location'] },
    { words: ['collaterals good', 'collateral status', 'blood flow'], answer: qaDatabase['are the collaterals good'] },
    { words: ['penumbra size', 'at risk tissue', 'salvageable tissue'], answer: qaDatabase['what is the penumbra size'] },
    { words: ['good candidate', 'should we intervene', 'treat this patient'], answer: qaDatabase['is this patient a good candidate for evt'] },
    { words: ['chances', 'good outcome', 'mrs 0-2', 'prognosis'], answer: qaDatabase['what are the chances of good outcome'] },
    // Keywords for Advanced Clinical Questions
    { words: ['multiple passes', 'thrombectomy passes', 'first pass', 'reperfusion', 'procedural course'], answer: qaDatabase['is this occlusion likely to require multiple thrombectomy passes'] },
    { words: ['leptomeningeal', 'pial dominance', 'collateral pathways', 'collateral filling'], answer: qaDatabase['do collateral pathways suggest leptomeningeal or pial dominance'] },
    { words: ['clot burden', 'embolic', 'in-situ thrombosis', 'thrombotic process', 'atherosclerosis'], answer: qaDatabase['does clot burden suggest an embolic or in-situ thrombotic process'] },
    { words: ['deep structures', 'edema vulnerability', 'malignant edema', 'perforator territory', 'basal ganglia', 'internal capsule'], answer: qaDatabase['are deep structures involved that increase edema vulnerability'] },
    { words: ['hypotension', 'blood pressure drop', 'tolerate hypotension', 'systemic pressure', 'penumbral perfusion'], answer: qaDatabase['would this patient tolerate even brief hypotension during evt'] },
  ];
  
  for (const { words, answer } of keywords) {
    if (words.some(word => normalizedQuestion.includes(word))) {
      return answer;
    }
  }
  
  return "I'm not sure about that. Try asking about: NIHSS score, core volume, occlusion location, collaterals, penumbra size, treatment eligibility, drip-and-ship vs direct mothership, or patient prognosis.";
}

export function ChatSidebar({ onClose }: ChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      type: 'bot',
      content: 'Hi, I can help you through stroke imaging, treatment decisions, and expected outcomes. What would you like to review?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate bot thinking
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: findBestAnswer(userMessage.content),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-neuro-bg-secondary">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neuro-border-subtle bg-neuro-bg-tertiary/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-neuro-salvaged/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-neuro-salvaged" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neuro-text-primary">NeuroSim Assistant</h3>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-neuro-text-tertiary hover:text-neuro-text-primary hover:bg-neuro-bg-tertiary rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-3',
              message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                message.type === 'user' ? 'bg-neuro-bg-tertiary' : 'bg-neuro-salvaged/20'
              )}
            >
              {message.type === 'user' ? (
                <User className="w-4 h-4 text-neuro-text-secondary" />
              ) : (
                <Bot className="w-4 h-4 text-neuro-salvaged" />
              )}
            </div>
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                message.type === 'user'
                  ? 'bg-cyan-700 text-white rounded-br-md'
                  : 'bg-neuro-bg-tertiary text-neuro-text-primary rounded-bl-md border border-neuro-border-subtle'
              )}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-neuro-salvaged/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-neuro-salvaged" />
            </div>
            <div className="bg-neuro-bg-tertiary rounded-2xl rounded-bl-md border border-neuro-border-subtle px-4 py-3 flex items-center gap-1">
              <span className="w-2 h-2 bg-neuro-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-neuro-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-neuro-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-neuro-border-subtle bg-neuro-bg-tertiary/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message"
            className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="px-4 py-2.5 bg-neuro-salvaged text-white rounded-xl hover:bg-neuro-salvaged/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}

export function ChatButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 text-neuro-text-secondary hover:text-neuro-text-primary hover:bg-neuro-bg-tertiary rounded-lg transition-colors"
      aria-label="Open chat"
    >
      <MessageCircle className="w-5 h-5" />
      <span className="text-sm font-medium">Chat</span>
    </button>
  );
}
