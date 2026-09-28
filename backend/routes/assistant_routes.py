from flask import Blueprint, request, jsonify
from backend.ai.intent_parser import AIAssistantService

assistant_bp = Blueprint('assistant', __name__)

@assistant_bp.route('/api/assistant/parse', methods=['POST'])
def parse_travel_intent():
    data = request.get_json() or {}
    prompt = (data.get('prompt') or data.get('user_input') or data.get('query') or '').strip()

    if not prompt:
        return jsonify({
            'error': 'Prompt is required'
        }), 400

    parsed_data = AIAssistantService.parse_travel_prompt(prompt)
    return jsonify({
        'success': True,
        'query': prompt,
        'result': parsed_data
    }), 200
