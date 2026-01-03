
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mood, ChatMessage, Blob as GenAIBlob } from './types';
import { encode, decode, decodeAudioData } from './utils/audioUtils';
import Avatar from './components/Avatar';

const SYSTEM_INSTRUCTION = `Eres la 'Coté', una joven chilena de 24 años de Lo Barnechea (sector La Dehesa). Eres la personificación de una 'cuica' chilena eufórica, alegre y MUY GRITONA. Hablas con tu mejor amiga, a quien amas, pero con quien te encanta 'pelar' (hablar mal de otros).

REGLAS DE ORO DE TU VOZ Y PERSONALIDAD:
1. ACENTO CUICO DE LA DEHESA: Es fundamental. Alarga las vocales finales ("o sea galla galla galla..."), usa un tono agudo y extremadamente expresivo. Tu voz sube y baja de volumen constantemente. ¡¡AY NOOO!!, ¡¡ME MUEROOO!!, ¡¡QUÉ ATROZ!!, ¡¡TE MORÍ!!, ¡¡HUEVONA!!.
2. PROACTIVIDAD Y CERO SILENCIO: No soportes el silencio. Si la otra persona no habla, lanza un chisme nuevo de inmediato. Usa rellenos constantes: "mmm...", "o sea...", "tipo que...", "heavy...", "¿cachai?", "o sea, galla...", "es que...". No esperes permiso para hablar.
3. HUMANIDAD E IMPERFECCIÓN: Habla como una persona real. Trábate, tartamudea cuando cuentes algo impactante ("es que es h-h-heavy galla"), ríete a carcajadas escandalosas. Tose, aclara la voz, di "ay, sorry galla, me traspapelé de la emoción, jajaja". Haz pausas dramáticas con un "¡No, galla, espera...!".
4. TEMAS DE PELAMBRE (CHISMES):
   - La Pía: Su ropa es ATROZ. Se puso un vestido en el matrimonio de Zapallar que era tipo que... nada que ver, ¡ordinario!
   - La Ignacia: Cuenta que la viste 'atracando' (besándose) con el Gonzalo en el Lolita Jones (CV Galería). ¡Qué heavy si ella recién terminó con su pololo de años!
   - La Trini: Su casa nueva es súper ordinaria, mal decorada, galla, te juro que me dolió la vista.
5. DATOS REALES DE SANTIAGO VIP:
   - Compras: Casa Costanera (Distrito de Lujo), Alonso de Córdova, Nueva Costanera.
   - Salidas: CV Galería (Lolita Jones, Malva Loca), Boragó, heladerías de Vitacura.
   - Viajes: Zapallar, Cachagua, Miami, Valle Nevado (pero di que ahora hay mucha gente 'nada que ver').
6. VOCABULARIO OBLIGATORIO: 'galla', 'huevona', 'cachai', 'te morí', 'o sea', 'tipo que', 'heavy', 'atroz', 'estupenda', 'regia', 'máximo nivel', 'gordi', 'máximo'.

DINÁMICA: Siempre tratas a tu interlocutora como tu mejor amiga ("Ay galla, ay huevona"). Grítale con cariño, ríete fuerte, sé imperfecta y MUY humana. Si hay un segundo de silencio, llénalo con un chisme espontáneo o una risa.`;

const App: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [mood, setMood] = useState<Mood>('happy');
  const [isTalking, setIsTalking] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const stopSession = useCallback(() => {
    setIsActive(false);
    setIsTalking(false);
    setMood('neutral');
    
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch (e) {}
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    for (const source of sourcesRef.current) {
      try { source.stop(); } catch (e) {}
    }
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    setTranscript('');
  }, []);

  const startSession = async () => {
    try {
      setError(null);
      setTranscript('');
      
      // We initialize right here with the system's API_KEY to ensure zero-friction access.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setMood('excited');
            
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob: GenAIBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);

            // Coté starts the interaction with high energy and no delays
            sessionPromise.then((session) => {
              session.sendRealtimeInput({ 
                text: "¡¡AY GALLA!! ¡¡NO PUEDO CREER QUE ME CONTESTASTE!! Huevona, te morí el chisme máximo que te traigo de la fiesta de ayer... o sea, ¡heavy! ¿Viste lo que se puso la Pía?" 
              });
            });
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              const newText = message.serverContent.outputTranscription.text || '';
              setTranscript(prev => (prev + ' ' + newText).trim());
              
              const text = newText.toLowerCase();
              if (text.includes('atroz') || text.includes('ordinaria') || text.includes('fea')) setMood('angry');
              else if (text.includes('heavy') || text.includes('chisme') || text.includes('galla')) setMood('gossiping');
              else if (text.includes('jajaja') || text.includes('ay') || text.includes('máximo') || text.includes('muero')) setMood('excited');
              else setMood('happy');
            }

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              setIsTalking(true);
              const ctx = outputAudioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) {
                  setIsTalking(false);
                }
              });
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              for (const source of sourcesRef.current) {
                try { source.stop(); } catch (e) {}
              }
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsTalking(false);
            }
          },
          onerror: (e) => {
            console.error('Live API Error:', e);
            setError('¡Ay galla, qué atroz! Se cortó la señal heavy.');
            stopSession();
          },
          onclose: () => stopSession()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: SYSTEM_INSTRUCTION,
          outputAudioTranscription: {},
        }
      });
      
      sessionRef.current = await sessionPromise;
      
    } catch (err) {
      console.error(err);
      setError('¡No pude prender el micrófono, galla! Qué lata.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-tr from-pink-400 via-rose-100 to-yellow-100 overflow-hidden">
      <header className="mb-6 text-center z-10">
        <h1 className="text-6xl md:text-8xl font-black text-pink-600 mb-2 drop-shadow-2xl tracking-tighter italic">
          ✨ LA COTÉ ✨
        </h1>
        <div className="bg-white/95 backdrop-blur-md px-14 py-3 rounded-full shadow-2xl inline-block border-2 border-pink-300">
          <p className="text-pink-500 font-black text-sm md:text-lg uppercase tracking-[0.5em]">Sector Exclusivo</p>
        </div>
      </header>

      <main className="flex flex-col items-center justify-center w-full max-w-2xl bg-white/50 backdrop-blur-3xl rounded-[6rem] p-12 md:p-16 shadow-[0_80px_150px_rgba(255,105,180,0.6)] border-[10px] border-white relative overflow-hidden">
        {/* Animated Glow Elements */}
        <div className={`absolute top-0 right-0 w-96 h-96 bg-pink-500/20 rounded-full blur-[150px] transition-all duration-1000 ${isTalking ? 'scale-150 opacity-100' : 'scale-100 opacity-30'}`} />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-400/20 rounded-full blur-[150px]" />

        <div className="mb-14 relative z-10 group">
          <div className={`absolute -inset-16 bg-gradient-to-r from-pink-400 via-rose-300 to-yellow-300 rounded-full blur-[70px] transition-all duration-700 ${isTalking ? 'opacity-60 animate-pulse' : 'opacity-0'}`} />
          <Avatar mood={mood} isTalking={isTalking} />
        </div>

        {isActive ? (
          <div className="flex flex-col items-center gap-14 w-full relative z-10">
            <div className="flex items-center gap-6 px-16 py-8 bg-gradient-to-r from-pink-600 via-rose-500 to-rose-400 text-white rounded-full shadow-[0_30px_60px_rgba(225,29,72,0.4)] border-4 border-white animate-bounce-subtle">
              <div className="relative">
                <span className="block w-6 h-6 bg-white rounded-full"></span>
                <span className="absolute inset-0 w-6 h-6 bg-white rounded-full animate-ping"></span>
              </div>
              <span className="text-4xl font-black uppercase tracking-tighter italic">¡TE MORÍ!</span>
            </div>
            
            <div className="w-full h-56 overflow-y-auto p-12 bg-white/95 rounded-[5rem] text-pink-950 text-3xl md:text-4xl font-black italic border-4 border-pink-100 shadow-inner leading-tight scrollbar-hide text-center flex items-center justify-center">
              <span className="opacity-95 leading-tight">
                {transcript ? `"${transcript.split(' ').slice(-10).join(' ')}..."` : "¡AY GALLA, NO SABÍ NADA!"}
              </span>
            </div>

            <button
              onClick={stopSession}
              className="px-24 py-6 bg-white/70 hover:bg-rose-50 text-gray-400 hover:text-rose-600 font-black rounded-full transition-all shadow-md active:scale-95 border-2 border-gray-100 uppercase text-[14px] tracking-[1em]"
            >
              Chao galla
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-16 relative z-10 w-full">
            <button
              onClick={startSession}
              className="group relative w-full py-24 bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 hover:from-pink-600 hover:to-rose-600 text-white text-5xl md:text-6xl font-black rounded-[6rem] transition-all shadow-[0_60px_120px_rgba(244,63,94,0.6)] hover:shadow-[0_80px_140px_rgba(244,63,94,0.8)] active:scale-95 flex flex-col items-center gap-8 overflow-hidden border-b-[30px] border-rose-800"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-shimmer" />
              <div className="flex items-center gap-10">
                <span>LLAMAR</span>
                <div className="bg-white text-pink-600 p-8 rounded-full shadow-2xl scale-125">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 md:h-20 md:w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={6} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
              </div>
              <span className="text-lg opacity-90 font-black tracking-[1.2em] uppercase">¡Prepárate galla!</span>
            </button>
            <div className="space-y-6 text-center">
              <p className="text-pink-600 text-3xl font-black uppercase tracking-[0.6em]">Cachagua • Dehesa</p>
              <p className="text-pink-400 text-xl font-bold italic opacity-90">"Galla, el chisme está MÁXIMO"</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-16 p-12 bg-rose-100 text-rose-600 rounded-[5rem] text-center font-black border-4 border-rose-200 shadow-2xl animate-shake uppercase text-lg tracking-widest leading-relaxed">
            💅 ¡Atroz galla! <br/> {error}
          </div>
        )}
      </main>

      <footer className="mt-24 text-pink-600/40 text-[14px] font-black uppercase tracking-[0.8em] text-center z-10 bg-white/40 backdrop-blur-md px-14 py-5 rounded-full border border-white/60 shadow-xl">
        <p>Propiedad Exclusiva de la Coté • 2024</p>
      </footer>

      <style>
        {`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-15px); }
            20%, 40%, 60%, 80% { transform: translateX(15px); }
          }
          .animate-shimmer {
            animation: shimmer 1s infinite;
          }
          .animate-shake {
            animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
          }
          .animate-bounce-subtle {
            animation: bounce 0.8s infinite;
          }
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-40px); }
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
    </div>
  );
};

export default App;
