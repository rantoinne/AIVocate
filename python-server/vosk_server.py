#!/usr/bin/env python3
import asyncio
import websockets
import json
import vosk
import logging
import os
import re
from pathlib import Path

# Import our intelligent components (fallback if not available)
try:
    from dynamic_vocabulary_manager import DynamicVocabularyManager
    from intelligent_corrector import IntelligentCorrector
    SMART_FEATURES_AVAILABLE = False
except ImportError as e:
    SMART_FEATURES_AVAILABLE = False
    DynamicVocabularyManager = None
    IntelligentCorrector = None

# Configure logging
logging.info(f"SMART_FEATURES_AVAILABLE {SMART_FEATURES_AVAILABLE}")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Disable Vosk verbose logging
vosk.SetLogLevel(-1)

class VoskSTTServer:
    def __init__(self, model_path=None, sample_rate=16000):
        self.sample_rate = sample_rate
        
        # Auto-detect best available model
        if model_path is None:
            model_path = self._find_best_model()
        
        # Check if model exists
        if not os.path.exists(model_path):
            logger.error(f"Model not found at {model_path}")
            raise FileNotFoundError(f"Vosk model not found at {model_path}")
        
        # Load Vosk model
        logger.info(f"Loading Vosk model from {model_path}")
        self.model = vosk.Model(model_path)
        self.model_path = model_path
        logger.info(f"✅ Vosk model loaded: {Path(model_path).name}")
        
        # Store active connections
        self.connections = set()
        
        # Initialize intelligent components only if using base model
        if "tech-adapted" not in str(model_path) and SMART_FEATURES_AVAILABLE:
            logger.info("🧠 Using base model - initializing smart correction...")
            try:
                self.vocab_manager = DynamicVocabularyManager()
                self.corrector = None  # Will be initialized async
                asyncio.create_task(self.vocab_manager.auto_update())
                logger.info("✅ Smart correction system initialized")
            except Exception as e:
                logger.warning(f"Smart correction failed to initialize: {e}")
                self.vocab_manager = None
                self.corrector = None
        else:
            if "tech-adapted" in str(model_path):
                logger.info("🎯 Using tech-adapted model - enhanced recognition ready!")
            else:
                logger.info("📝 Using base model without smart features")
            self.vocab_manager = None
            self.corrector = None
        
        logger.info("✅ STT system ready")
    
    def _find_best_model(self):
        """Find the best available model"""
        model_preferences = [
            "models/vosk-model-tech-adapted",           # Custom trained
            "models/vosk-model-en-us-0.22",             # Large model
            "models/vosk-model-en-us-daanzu-20200905",  # Medium model  
            "models/vosk-model-small-en-us-0.15"        # Small model
        ]
        
        for model_path in model_preferences:
            if os.path.exists(model_path):
                logger.info(f"🔍 Found model: {model_path}")
                return model_path
        
        # Default fallback
        return "models/vosk-model-small-en-us-0.15"
    
    def _is_using_custom_model(self):
        """Check if using a custom tech-adapted model"""
        return "tech-adapted" in str(self.model_path).lower()
        
    async def initialize_corrector(self):
        """Initialize the corrector asynchronously (only for base models)"""
        if not self.corrector and self.vocab_manager and SMART_FEATURES_AVAILABLE:
            try:
                self.corrector = IntelligentCorrector(self.vocab_manager)
                await self.corrector.__aenter__()
                logger.info("🎯 Intelligent corrector initialized")
            except Exception as e:
                logger.error(f"Failed to initialize corrector: {e}")
                self.corrector = None

    async def handle_client(self, websocket, path):
        """Handle individual WebSocket connections"""
        client_id = f"{websocket.remote_address[0]}:{websocket.remote_address[1]}"
        logger.info(f"✅ New client connected: {client_id}")
        
        # Initialize corrector if not already done (only for base models)
        if self.vocab_manager:
            await self.initialize_corrector()
        
        # Add to active connections
        self.connections.add(websocket)
        
        # Create recognizer for this connection
        rec = vosk.KaldiRecognizer(self.model, self.sample_rate)
        rec.SetWords(True)  # Enable word-level timestamps
        
        # Determine model type for client info
        model_type = "custom-trained" if self._is_using_custom_model() else "base-with-correction"
        vocab_size = len(self.vocab_manager.get_vocabulary()) if self.vocab_manager else "N/A (custom model)"
        
        try:
            # Send connection confirmation
            await websocket.send(json.dumps({
                "type": "connection",
                "status": "connected",
                "message": f"STT ready - {model_type} model",
                "model_type": model_type,
                "model_path": str(Path(self.model_path).name),
                "vocabulary_size": vocab_size,
                "features": {
                    "custom_trained": self._is_using_custom_model(),
                    "smart_correction": self.vocab_manager is not None,
                    "auto_learning": self.vocab_manager is not None
                }
            }))
            
            logger.info(f"🎤 Client {client_id} ready - Model: {Path(self.model_path).name}")
            
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
                                original_text = result['text']
                                
                                # Apply corrections only if using base model
                                if self.corrector:
                                    corrected_text = await self.corrector.correct_text(original_text)
                                    suggestions = self.corrector.get_correction_suggestions(original_text, limit=3)
                                else:
                                    corrected_text = original_text
                                    suggestions = None
                                
                                response = {
                                    "type": "final",
                                    "transcript": corrected_text,
                                    "original": original_text if corrected_text != original_text else None,
                                    "confidence": result.get('confidence', 0),
                                    "words": result.get('words', []),
                                    "suggestions": suggestions if suggestions else None,
                                    "model_type": model_type
                                }
                                
                                # Add vocabulary info for base models
                                if self.vocab_manager:
                                    response["vocabulary_learned"] = len(self.vocab_manager.get_vocabulary())
                                
                                await websocket.send(json.dumps(response))
                                
                                if corrected_text != original_text:
                                    logger.info(f"📝 {model_type} correction: '{original_text}' → '{corrected_text}'")
                                else:
                                    logger.info(f"📝 Transcript: '{corrected_text}'")
                        else:
                            # Partial result
                            partial = json.loads(rec.PartialResult())
                            if partial.get('partial'):
                                original_partial = partial['partial']
                                
                                # Apply corrections to partial results (lighter processing)
                                if self.corrector:
                                    corrected_partial = await self.corrector.correct_text(original_partial)
                                else:
                                    corrected_partial = original_partial
                                
                                await websocket.send(json.dumps({
                                    "type": "partial",
                                    "transcript": corrected_partial,
                                    "original": original_partial if corrected_partial != original_partial else None
                                }))
                    
                    elif isinstance(message, str):
                        # Handle text commands
                        try:
                            command = json.loads(message)
                            await self._handle_command(command, websocket, client_id, rec)
                                
                        except json.JSONDecodeError:
                            logger.warning(f"⚠️ Invalid JSON command from {client_id}: {message}")
                            
                except asyncio.TimeoutError:
                    # Send ping to keep connection alive
                    try:
                        ping_data = {
                            "type": "ping",
                            "timestamp": asyncio.get_event_loop().time(),
                            "model_type": model_type
                        }
                        
                        if self.vocab_manager:
                            ping_data["vocabulary_size"] = len(self.vocab_manager.get_vocabulary())
                        
                        await websocket.send(json.dumps(ping_data))
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
            
            # Clean up corrector if this was the last connection
            if not self.connections and self.corrector:
                try:
                    await self.corrector.__aexit__(None, None, None)
                    self.corrector = None
                except:
                    pass
    
    async def _handle_command(self, command, websocket, client_id, rec):
        """Handle WebSocket commands"""
        action = command.get('action')
        
        if action == 'reset':
            # Reset recognizer
            rec = vosk.KaldiRecognizer(self.model, self.sample_rate)
            rec.SetWords(True)
            await websocket.send(json.dumps({
                "type": "status",
                "message": "Recognizer reset"
            }))
            logger.info(f"🔄 Recognizer reset for {client_id}")
        
        elif action == 'get_model_info':
            # Get detailed model information
            model_info = {
                "type": "model_info",
                "model_path": str(self.model_path),
                "model_name": Path(self.model_path).name,
                "model_type": "custom-trained" if self._is_using_custom_model() else "base-with-correction",
                "sample_rate": self.sample_rate,
                "features": {
                    "custom_trained": self._is_using_custom_model(),
                    "smart_correction": self.vocab_manager is not None,
                    "auto_learning": self.vocab_manager is not None
                }
            }
            
            if self.vocab_manager:
                model_info["vocabulary_size"] = len(self.vocab_manager.get_vocabulary())
                model_info["last_vocab_update"] = self.vocab_manager.last_update
            
            await websocket.send(json.dumps(model_info))
        
        elif action == 'retrain_model' and not self._is_using_custom_model():
            # Trigger model retraining (placeholder for future implementation)
            await websocket.send(json.dumps({
                "type": "status",
                "message": "Model retraining not available in this version"
            }))
        
        # Handle commands specific to base models with correction
        elif self.vocab_manager:
            if action == 'get_vocabulary_stats':
                vocab = self.vocab_manager.get_vocabulary()
                trending = self.vocab_manager.trending_terms.most_common(10)
                
                await websocket.send(json.dumps({
                    "type": "vocabulary_stats",
                    "total_terms": len(vocab),
                    "trending_terms": [{"term": term, "count": count} for term, count in trending],
                    "last_update": self.vocab_manager.last_update
                }))
            
            elif action == 'force_vocabulary_update':
                logger.info(f"🔄 Forcing vocabulary update for {client_id}")
                await self.vocab_manager.fetch_trending_tech_terms()
                await websocket.send(json.dumps({
                    "type": "status",
                    "message": f"Vocabulary updated: {len(self.vocab_manager.get_vocabulary())} terms"
                }))
            
            elif action == 'search_terms':
                query = command.get('query', '')
                if query:
                    similar = self.vocab_manager.search_similar_terms(query, limit=5)
                    await websocket.send(json.dumps({
                        "type": "search_results",
                        "query": query,
                        "similar_terms": similar
                    }))
            
            elif action == 'add_custom_terms':
                terms = command.get('terms', [])
                if terms:
                    self.vocab_manager.add_terms(terms)
                    await websocket.send(json.dumps({
                        "type": "status",
                        "message": f"Added {len(terms)} custom terms"
                    }))
                    logger.info(f"📚 Added custom terms: {terms}")
        
        elif action == 'ping':
            # Respond to ping
            pong_data = {
                "type": "pong",
                "timestamp": command.get('timestamp'),
                "server_info": {
                    "model_type": "custom-trained" if self._is_using_custom_model() else "base-with-correction",
                    "active_connections": len(self.connections)
                }
            }
            
            if self.vocab_manager:
                pong_data["server_info"]["vocabulary_size"] = len(self.vocab_manager.get_vocabulary())
            
            await websocket.send(json.dumps(pong_data))

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