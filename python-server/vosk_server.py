#!/usr/bin/env python3
import asyncio
import websockets
import json
import vosk
import logging
import os
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Disable Vosk verbose logging
vosk.SetLogLevel(-1)

class VoskSTTServer:
    # def __init__(self, model_path="models/vosk-model-small-en-us-0.15", sample_rate=16000):
    def __init__(self, model_path="models/vosk-model-en-us-0.22", sample_rate=16000):
        self.sample_rate = sample_rate
        
        # Check if model exists
        if not os.path.exists(model_path):
            logger.error(f"Model not found at {model_path}")
            raise FileNotFoundError(f"Vosk model not found at {model_path}")
        
        # Load Vosk model
        logger.info(f"Loading Vosk model from {model_path}")
        self.model = vosk.Model(model_path)
        logger.info("Vosk model loaded successfully")
        
        # Store active connections
        self.connections = set()

    async def handle_client(self, websocket, path):
        """Handle individual WebSocket connections"""
        client_id = f"{websocket.remote_address[0]}:{websocket.remote_address[1]}"
        logger.info(f"✅ New client connected: {client_id}")
        
        # Add to active connections
        self.connections.add(websocket)
        
        # Create recognizer for this connection
        rec = vosk.KaldiRecognizer(self.model, self.sample_rate)
        rec.SetWords(True)  # Enable word-level timestamps
        
        try:
            # Send connection confirmation
            await websocket.send(json.dumps({
                "type": "connection",
                "status": "connected",
                "message": "Ready for audio data"
            }))
            
            logger.info(f"🎤 Client {client_id} ready for audio")
            
            # Keep connection alive and handle messages
            while True:
                try:
                    # Wait for message with timeout
                    message = await asyncio.wait_for(websocket.recv(), timeout=60.0)
                    
                    if isinstance(message, bytes):
                        # Process audio data
                        if rec.AcceptWaveform(message):
                            # Final result
                            result = json.loads(rec.Result())
                            if result.get('text'):
                                await websocket.send(json.dumps({
                                    "type": "final",
                                    "transcript": result['text'],
                                    "confidence": result.get('confidence', 0),
                                    "words": result.get('words', [])
                                }))
                                logger.info(f"📝 Final transcript from {client_id}: {result['text']}")
                        else:
                            # Partial result
                            partial = json.loads(rec.PartialResult())
                            if partial.get('partial'):
                                await websocket.send(json.dumps({
                                    "type": "partial",
                                    "transcript": partial['partial']
                                }))
                    
                    elif isinstance(message, str):
                        # Handle text commands
                        try:
                            command = json.loads(message)
                            if command.get('action') == 'reset':
                                # Reset recognizer
                                rec = vosk.KaldiRecognizer(self.model, self.sample_rate)
                                rec.SetWords(True)
                                await websocket.send(json.dumps({
                                    "type": "status",
                                    "message": "Recognizer reset"
                                }))
                                logger.info(f"🔄 Recognizer reset for {client_id}")
                            elif command.get('action') == 'ping':
                                # Respond to ping
                                await websocket.send(json.dumps({
                                    "type": "pong",
                                    "timestamp": command.get('timestamp')
                                }))
                        except json.JSONDecodeError:
                            logger.warning(f"⚠️ Invalid JSON command from {client_id}: {message}")
                            
                except asyncio.TimeoutError:
                    # Send ping to keep connection alive
                    try:
                        await websocket.send(json.dumps({
                            "type": "ping",
                            "timestamp": asyncio.get_event_loop().time()
                        }))
                        logger.debug(f"🏓 Ping sent to {client_id}")
                    except:
                        break
                        
                except websockets.exceptions.ConnectionClosed:
                    logger.info(f"🔌 Client {client_id} disconnected normally")
                    break
                    
                except Exception as e:
                    logger.error(f"💥 Error processing message from {client_id}: {e}")
                    try:
                        await websocket.send(json.dumps({
                            "type": "error",
                            "message": str(e)
                        }))
                    except:
                        break
                    
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"🔌 Client {client_id} disconnected")
        except Exception as e:
            logger.error(f"💥 Error with client {client_id}: {e}")
        finally:
            # Clean up
            self.connections.discard(websocket)
            logger.info(f"🧹 Cleaned up connection for {client_id}")
            
            # Get final result if any
            try:
                final_result = json.loads(rec.FinalResult())
                if final_result.get('text'):
                    await websocket.send(json.dumps({
                        "type": "final",
                        "transcript": final_result['text'],
                        "confidence": final_result.get('confidence', 0),
                        "words": final_result.get('words', [])
                    }))
            except:
                pass

    async def start_server(self, host="0.0.0.0", port=8765):
        """Start the WebSocket server"""
        logger.info(f"Starting Vosk WebSocket server on {host}:{port}")
        
        try:
            server = await websockets.serve(
                self.handle_client,
                host,
                port,
                ping_interval=20,    # Send ping every 20 seconds
                ping_timeout=10,     # Wait 10 seconds for pong
                max_size=10**7,      # 10MB max message size
                close_timeout=10     # Close timeout
            )
            
            logger.info(f"✅ Vosk STT server running on ws://{host}:{port}")
            logger.info(f"✅ Ready to accept connections. Send 16kHz mono PCM audio data.")
            logger.info(f"🏓 Ping interval: 20s, timeout: 10s")
            
            return server
            
        except Exception as e:
            logger.error(f"❌ Failed to start server: {e}")
            raise

async def main():
    try:
        # Initialize server
        logger.info("🚀 Initializing Vosk STT Server...")
        server = VoskSTTServer()
        
        # Start WebSocket server
        websocket_server = await server.start_server()
        
        logger.info("🎤 Server is ready! Connect your client to ws://localhost:8765")
        
        # Keep server running indefinitely
        await websocket_server.wait_closed()
        
    except FileNotFoundError as e:
        logger.error(f"❌ Model file error: {e}")
        logger.error("💡 Make sure the Vosk model is downloaded correctly")
    except Exception as e:
        logger.error(f"❌ Server initialization failed: {e}")
        raise

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("🛑 Server stopped by user")
    except Exception as e:
        logger.error(f"💥 Fatal server error: {e}")
        exit(1)