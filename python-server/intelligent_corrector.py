#!/usr/bin/env python3
"""
Intelligent corrector that uses context and external services
"""
import asyncio
import aiohttp
import json
import re
import logging
from typing import List, Optional
from rapidfuzz import fuzz, process

logger = logging.getLogger(__name__)

class IntelligentCorrector:
    """AI-powered text correction with context awareness"""
    
    def __init__(self, vocab_manager):
        self.vocab_manager = vocab_manager
        self.context_window = []
        self.session = None
        
        # Common phonetic replacements for tech terms
        self.phonetic_mappings = {
            # Letter-by-letter spellings
            r'\ba p i\b': 'api',
            r'\bj son\b': 'json', 
            r'\bx m l\b': 'xml',
            r'\bs q l\b': 'sql',
            r'\bh t m l\b': 'html',
            r'\bc s s\b': 'css',
            r'\bg p t\b': 'gpt',
            r'\ba i\b': 'ai',
            r'\bm l\b': 'ml',
            r'\bu i\b': 'ui',
            r'\bu x\b': 'ux',
            
            # Common mishearings
            r'\bweb socket\b': 'websocket',
            r'\bnode js\b': 'nodejs',
            r'\bnext js\b': 'nextjs',
            r'\bview js\b': 'vuejs',
            r'\breact js\b': 'reactjs',
            r'\btype script\b': 'typescript',
            r'\bjava script\b': 'javascript',
            r'\bmongo db\b': 'mongodb',
            r'\bpostgres ql\b': 'postgresql',
            r'\bmy sql\b': 'mysql',
            r'\bdev ops\b': 'devops',
            r'\bci cd\b': 'cicd',
            r'\baws\b': 'aws',
            r'\bgcp\b': 'gcp',
            
            # AI/ML specific
            r'\bchat gpt\b': 'chatgpt',
            r'\bopen ai\b': 'openai',
            r'\bhugging face\b': 'huggingface',
            r'\bpy torch\b': 'pytorch',
            r'\btensor flow\b': 'tensorflow',
            r'\bsci kit learn\b': 'scikit-learn',
        }
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def add_context(self, text: str):
        """Add text to context window"""
        if text:
            self.context_window.append(text.lower())
            # Keep last 20 sentences for context
            if len(self.context_window) > 20:
                self.context_window = self.context_window[-20:]
    
    def _apply_phonetic_corrections(self, text: str) -> str:
        """Apply phonetic correction patterns"""
        corrected = text.lower()
        for pattern, replacement in self.phonetic_mappings.items():
            corrected = re.sub(pattern, replacement, corrected, flags=re.IGNORECASE)
        return corrected
    
    def _get_context_terms(self) -> set:
        """Extract relevant terms from recent context"""
        context_terms = set()
        context_text = ' '.join(self.context_window)
        
        # Extract potential tech terms from context
        words = re.findall(r'\b[a-zA-Z][a-zA-Z0-9]*\b', context_text)
        for word in words:
            if word in self.vocab_manager.get_vocabulary():
                context_terms.add(word)
        
        return context_terms
    
    def _intelligent_word_correction(self, word: str) -> str:
        """Intelligently correct a single word using multiple strategies"""
        clean_word = re.sub(r'[^\w]', '', word.lower())
        
        if not clean_word or len(clean_word) < 2:
            return word
        
        # Strategy 1: Exact match in tech vocabulary
        if clean_word in self.vocab_manager.get_vocabulary():
            return word  # Already correct
        
        # Strategy 2: Fuzzy match against tech terms
        tech_vocab = self.vocab_manager.get_vocabulary()
        if tech_vocab:
            matches = process.extract(
                clean_word,
                tech_vocab,
                scorer=fuzz.ratio,
                limit=1,
                score_cutoff=75
            )
            if matches:
                best_match = matches[0][0]
                # Preserve original case and punctuation
                return word.replace(clean_word, best_match)
        
        # Strategy 3: Context-based correction
        context_terms = self._get_context_terms()
        if context_terms:
            context_matches = process.extract(
                clean_word,
                context_terms,
                scorer=fuzz.ratio,
                limit=1,
                score_cutoff=70
            )
            if context_matches:
                return word.replace(clean_word, context_matches[0][0])
        
        # Strategy 4: Common abbreviation expansion
        abbreviations = {
            'js': 'javascript',
            'ts': 'typescript', 
            'py': 'python',
            'db': 'database',
            'ci': 'continuous integration',
            'cd': 'continuous deployment',
            'ui': 'user interface',
            'ux': 'user experience',
            'ml': 'machine learning',
            'ai': 'artificial intelligence',
            'api': 'api',
            'sdk': 'software development kit',
            'ide': 'integrated development environment'
        }
        
        if clean_word in abbreviations:
            return word.replace(clean_word, abbreviations[clean_word])
        
        return word  # No correction found
    
    async def correct_text_with_ai(self, text: str) -> Optional[str]:
        """Use external AI service for correction (optional enhancement)"""
        try:
            # This would integrate with a service like OpenAI API for context-aware corrections
            # For now, we'll simulate this with local processing
            
            # Check if text contains likely tech terms that need correction
            likely_tech_indicators = [
                r'\b[a-z] [a-z] [a-z]\b',  # letter-by-letter spellings
                r'\bweb \w+\b',            # web technologies
                r'\bnode \w+\b',           # node technologies
                r'\b\w+ js\b',             # JavaScript frameworks
                r'\b\w+ sql\b',            # SQL variants
            ]
            
            has_tech_indicators = any(re.search(pattern, text.lower()) for pattern in likely_tech_indicators)
            
            if has_tech_indicators:
                # Apply enhanced corrections for tech content
                return self._apply_phonetic_corrections(text)
            
            return None  # No AI correction needed
            
        except Exception as e:
            logger.debug(f"AI correction failed: {e}")
            return None
    
    async def correct_text(self, text: str) -> str:
        """Main correction method with multiple strategies"""
        if not text or len(text.strip()) < 2:
            return text
        
        original_text = text
        
        # Step 1: Apply phonetic corrections
        corrected = self._apply_phonetic_corrections(text)
        
        # Step 2: Word-by-word intelligent correction
        words = corrected.split()
        corrected_words = []
        
        for word in words:
            corrected_word = self._intelligent_word_correction(word)
            corrected_words.append(corrected_word)
        
        corrected = ' '.join(corrected_words)
        
        # Step 3: Try AI-powered correction if available
        ai_corrected = await self.correct_text_with_ai(corrected)
        if ai_corrected and ai_corrected != corrected:
            corrected = ai_corrected
        
        # Step 4: Add to context for future corrections
        self.add_context(corrected)
        
        # Update vocabulary with new terms that appear correct
        self._learn_from_correction(original_text, corrected)
        
        return corrected
    
    def _learn_from_correction(self, original: str, corrected: str):
        """Learn new patterns from corrections"""
        if original == corrected:
            return
            
        # Extract words that were changed
        orig_words = set(re.findall(r'\b[a-zA-Z][a-zA-Z0-9]*\b', original.lower()))
        corr_words = set(re.findall(r'\b[a-zA-Z][a-zA-Z0-9]*\b', corrected.lower()))
        
        # Add new corrected words to vocabulary if they look like tech terms
        new_words = corr_words - orig_words
        for word in new_words:
            if self.vocab_manager._is_valid_tech_term(word):
                self.vocab_manager.add_terms([word])
                logger.debug(f"Learned new term: {word}")
    
    def get_correction_suggestions(self, text: str, limit: int = 3) -> List[str]:
        """Get multiple correction suggestions"""
        suggestions = []
        
        # Get different correction strategies
        phonetic = self._apply_phonetic_corrections(text)
        if phonetic != text:
            suggestions.append(phonetic)
        
        # Get fuzzy matches for the whole phrase
        vocab = self.vocab_manager.get_vocabulary()
        phrase_matches = process.extract(
            text.lower(),
            vocab,
            scorer=fuzz.partial_ratio,
            limit=limit,
            score_cutoff=60
        )
        
        for match, score in phrase_matches:
            if match not in suggestions:
                suggestions.append(match)
        
        return suggestions[:limit]