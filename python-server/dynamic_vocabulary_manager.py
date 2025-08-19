#!/usr/bin/env python3
"""
Dynamic vocabulary manager that automatically learns tech terms from live sources
"""
import asyncio
import requests
import json
import re
import time
import feedparser
from bs4 import BeautifulSoup
from collections import Counter, defaultdict
import logging

logger = logging.getLogger(__name__)

class DynamicVocabularyManager:
    """Automatically discovers and learns new tech vocabulary"""
    
    def __init__(self):
        self.tech_terms = set()
        self.trending_terms = Counter()
        self.last_update = 0
        self.update_interval = 3600  # Update every hour
        
        # Initialize with basic terms
        self._load_base_vocabulary()
        
    def _load_base_vocabulary(self):
        """Load essential tech terms"""
        base_terms = {
            # AI/ML
            'ai', 'ml', 'llm', 'gpt', 'chatgpt', 'claude', 'anthropic', 'openai',
            'transformer', 'neural', 'pytorch', 'tensorflow', 'huggingface',
            
            # Programming languages
            'python', 'javascript', 'typescript', 'rust', 'go', 'java', 'kotlin',
            'swift', 'dart', 'php', 'ruby', 'scala', 'clojure', 'elixir',
            
            # Frameworks/Libraries
            'react', 'vue', 'angular', 'svelte', 'nextjs', 'nuxtjs', 'gatsby',
            'express', 'fastapi', 'django', 'flask', 'rails', 'spring',
            
            # Cloud/DevOps
            'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'terraform',
            'ansible', 'jenkins', 'github', 'gitlab', 'vercel', 'netlify',
            
            # Databases
            'postgresql', 'mysql', 'mongodb', 'redis', 'elasticsearch',
            'dynamodb', 'firestore', 'supabase', 'planetscale',
            
            # Protocols/Standards
            'api', 'rest', 'graphql', 'grpc', 'json', 'xml', 'yaml',
            'oauth', 'jwt', 'ssl', 'tls', 'websocket', 'cors'
        }
        self.tech_terms.update(base_terms)
        
    async def fetch_trending_tech_terms(self):
        """Fetch trending tech terms from various sources"""
        try:
            await asyncio.gather(
                self._fetch_from_github_trending(),
                self._fetch_from_hackernews(),
                self._fetch_from_stackoverflow(),
                return_exceptions=True
            )
            logger.info(f"Updated vocabulary: {len(self.tech_terms)} terms")
        except Exception as e:
            logger.error(f"Error fetching trending terms: {e}")
    
    async def _fetch_from_github_trending(self):
        """Get trending repositories and extract tech terms"""
        try:
            url = "https://api.github.com/search/repositories?q=created:>2024-01-01&sort=stars&order=desc&per_page=50"
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                for repo in data.get('items', []):
                    # Extract terms from repo names, descriptions, topics
                    text = f"{repo.get('name', '')} {repo.get('description', '')} {' '.join(repo.get('topics', []))}"
                    self._extract_tech_terms(text)
        except Exception as e:
            logger.debug(f"GitHub API error: {e}")
    
    async def _fetch_from_hackernews(self):
        """Get HackerNews front page for tech terms"""
        try:
            # Get top stories
            response = requests.get("https://hacker-news.firebaseio.com/v0/topstories.json", timeout=10)
            if response.status_code == 200:
                story_ids = response.json()[:30]  # Top 30 stories
                
                for story_id in story_ids[:10]:  # Limit to avoid rate limiting
                    try:
                        story_response = requests.get(f"https://hacker-news.firebaseio.com/v0/item/{story_id}.json", timeout=5)
                        if story_response.status_code == 200:
                            story = story_response.json()
                            title = story.get('title', '')
                            self._extract_tech_terms(title)
                            await asyncio.sleep(0.1)  # Rate limiting
                    except:
                        continue
        except Exception as e:
            logger.debug(f"HackerNews API error: {e}")
    
    async def _fetch_from_stackoverflow(self):
        """Get popular tags from StackOverflow"""
        try:
            url = "https://api.stackexchange.com/2.3/tags?order=desc&sort=popular&site=stackoverflow&pagesize=100"
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                for tag in data.get('items', []):
                    tag_name = tag.get('name', '').lower()
                    if self._is_valid_tech_term(tag_name):
                        self.tech_terms.add(tag_name)
                        self.trending_terms[tag_name] += tag.get('count', 0)
        except Exception as e:
            logger.debug(f"StackOverflow API error: {e}")
    
    def _extract_tech_terms(self, text):
        """Extract potential tech terms from text"""
        if not text:
            return
            
        # Clean and split text
        words = re.findall(r'\b[a-zA-Z][a-zA-Z0-9]*[a-zA-Z]\b', text.lower())
        
        for word in words:
            if self._is_valid_tech_term(word):
                self.tech_terms.add(word)
                self.trending_terms[word] += 1
    
    def _is_valid_tech_term(self, term):
        """Check if a term looks like a valid tech term"""
        if not term or len(term) < 2:
            return False
            
        # Skip common English words
        common_words = {
            'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had',
            'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his',
            'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy',
            'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'
        }
        
        if term in common_words:
            return False
            
        # Tech terms often have certain patterns
        tech_patterns = [
            r'.*js$',      # ends with js (reactjs, vuejs)
            r'.*api$',     # ends with api
            r'.*db$',      # ends with db (mongodb)
            r'.*sql$',     # ends with sql
            r'.*css$',     # ends with css
            r'.*ml$',      # ends with ml
            r'.*ai$',      # ends with ai
            r'^micro.*',   # starts with micro (microservices)
            r'^web.*',     # starts with web (websocket)
            r'^dev.*',     # starts with dev (devops)
            r'.*ops$',     # ends with ops (devops, gitops)
            r'.*lang$',    # ends with lang (golang)
        ]
        
        for pattern in tech_patterns:
            if re.match(pattern, term):
                return True
                
        # Check if it contains numbers (version indicators)
        if re.search(r'\d', term) and len(term) > 3:
            return True
            
        # Check if it's a known file extension or protocol
        extensions = {'json', 'xml', 'yaml', 'toml', 'csv', 'sql', 'html', 'css'}
        if term in extensions:
            return True
            
        return False
    
    async def auto_update(self):
        """Automatically update vocabulary periodically"""
        while True:
            try:
                current_time = time.time()
                if current_time - self.last_update > self.update_interval:
                    logger.info("🔄 Updating tech vocabulary...")
                    await self.fetch_trending_tech_terms()
                    self.last_update = current_time
                    
                    # Log some trending terms
                    top_terms = self.trending_terms.most_common(10)
                    if top_terms:
                        logger.info(f"📈 Trending: {[term for term, count in top_terms]}")
                        
                await asyncio.sleep(300)  # Check every 5 minutes
            except Exception as e:
                logger.error(f"Auto-update error: {e}")
                await asyncio.sleep(300)
    
    def get_vocabulary(self):
        """Get current vocabulary set"""
        return self.tech_terms.copy()
    
    def add_terms(self, terms):
        """Manually add terms"""
        if isinstance(terms, str):
            terms = [terms]
        for term in terms:
            if self._is_valid_tech_term(term.lower()):
                self.tech_terms.add(term.lower())
    
    def search_similar_terms(self, term, limit=5):
        """Find similar terms in vocabulary"""
        from rapidfuzz import process, fuzz
        
        matches = process.extract(
            term.lower(),
            self.tech_terms,
            scorer=fuzz.ratio,
            limit=limit,
            score_cutoff=60
        )
        return [match[0] for match in matches]