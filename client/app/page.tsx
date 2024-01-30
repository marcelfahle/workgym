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

  useEffect(() => {
    socket = io(SERVER_URL);

    socket.on('receive-image', ({ sessionId, image }: { sessionId: string, image: string }) => {
      console.log('received', image, sessionId)
      setAvatars(prevAvatars => ({
        ...prevAvatars,
        [sessionId]: image
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (webcamRef.current) {
        const image = webcamRef.current.getScreenshot();
        socket.emit('send-image', { sessionId, image });
      }
    }, 500);

    return () => clearInterval(interval);
  }, [webcamRef]);

  return (
    <div className='' >
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
      </div>
      <div style={{ marginTop: 100 }}>
        <h2>Buddies</h2>
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

