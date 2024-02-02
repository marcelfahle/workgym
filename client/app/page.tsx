'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import Webcam from 'react-webcam';
import { io, Socket } from 'socket.io-client';
import { nanoid } from 'nanoid'

let socket: Socket;
const SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL as string;


export default function Home() {
  const webcamRef = useRef<Webcam>(null);
  const [avatars, setAvatars] = useState({})
  const sessionId = useMemo(() => nanoid(), []);
  const [frameRate, setFrameRate] = useState(500);

  useEffect(() => {
    socket = io(SERVER_URL);

    socket.on('receive-image', ({ sessionId, image }: { sessionId: string, image: ArrayBuffer }) => {

      const b = new Blob([image], { type: "image/webp" })
      const url = URL.createObjectURL(b);
      setAvatars(prevAvatars => ({
        ...prevAvatars,
        [sessionId]: url
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (webcamRef.current) {
        const b64 = webcamRef.current.getScreenshot();
        if (b64) {
          fetch(b64)
            .then(res => res.blob())
            .then(blob => {
              socket.emit('send-image', { sessionId, image: blob });
            })

        }
      }
    }, frameRate);

    return () => clearInterval(interval);
  }, [webcamRef, frameRate]);

  function buddySpeed(fps: number) {
    switch (fps) {
      case 100:
        return "10 FPS 🔥🔥🔥"
      case 500:
        return "2 FPS"
      case 1000:
        return "1 FPS "
      case 2000:
        return "0.5 FPS 🐌🐌🐌"
    }
  }

  return (
    <div className='prose max-w-2xl mx-auto' >
      <h1>Work Gym</h1>
      <div id="mycam">
        <h2>My Cam</h2>
        <Webcam
          audio={false}
          className='border '
          ref={webcamRef}
          screenshotFormat="image/webp"
          width={100}
          videoConstraints={{ width: 100, height: 100 }}
        />
        <div>
          <label htmlFor="frameRate">Frame Rate (ms): </label>
          <select id="frameRate" value={frameRate} onChange={(e) => setFrameRate(Number(e.target.value))}>
            <option value="100">Very Fast (10 FPS / 100ms)</option>
            <option value="500">Fast (2 FPS / 500ms)</option>
            <option value="1000">Normal (1 FPS / 1s)</option>
            <option value="2000">Slow (0.5 FPS / 2s)</option>
          </select>
        </div>
      </div>
      <div style={{ marginTop: 100 }}>
        <h2>My Buddies in {buddySpeed(frameRate)}</h2>
        <div style={{ display: 'flex' }}>
          {Object.entries(avatars).map(([sessionId, img]) => (
            <div key={sessionId}>
              <img
                src={img as string}
                style={{ borderRadius: '100%', border: '2px #FFCA10 solid' }}
                alt={`Session ${sessionId}`} width={100} height={100} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

