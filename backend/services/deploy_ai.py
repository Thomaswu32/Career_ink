"""DeployAI Communication Service — CareerInk Backend"""
import os
import requests
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def get_access_token() -> str:
    data = {
        "grant_type": "client_credentials",
        "client_id": os.getenv("CLIENT_ID"),
        "client_secret": os.getenv("CLIENT_SECRET"),
    }
    url = os.getenv("AUTH_URL", "https://api-auth.deploy.ai/oauth2/token")
    response = requests.post(url, data=data, timeout=30)
    response.raise_for_status()
    return response.json()["access_token"]


def create_chat(access_token: str) -> str:
    headers = {
        "accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}",
        "X-Org": os.getenv("ORG_ID", ""),
    }
    json_data = {
        "agentId": "GPT_4O",
        "stream": False,
    }
    api_url = os.getenv("API_URL", "https://core-api.deploy.ai")
    response = requests.post(f"{api_url}/chats", headers=headers, json=json_data, timeout=30)
    response.raise_for_status()
    return response.json()["id"]


def call_agent(access_token: str, chat_id: str, question: str) -> str:
    headers = {
        "X-Org": os.getenv("ORG_ID", ""),
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    json_data = {
        "chatId": chat_id,
        "stream": False,
        "content": [{"type": "text", "value": question}],
    }
    api_url = os.getenv("API_URL", "https://core-api.deploy.ai")
    response = requests.post(f"{api_url}/messages", headers=headers, json=json_data, timeout=60)
    response.raise_for_status()
    return response.json()["content"][0]["value"]


def llm_call(prompt: str, system: Optional[str] = None) -> str:
    """Single-shot LLM call — creates a fresh chat each time."""
    try:
        token = get_access_token()
        chat_id = create_chat(token)
        full_prompt = f"{system}\n\n{prompt}" if system else prompt
        return call_agent(token, chat_id, full_prompt)
    except Exception as e:
        logger.error(f"DeployAI call failed: {e}")
        raise
