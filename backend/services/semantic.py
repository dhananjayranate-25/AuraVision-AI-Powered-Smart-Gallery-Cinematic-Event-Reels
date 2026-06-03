# Semantic Search placeholder
# In a real implementation, this would use CLIP (Contrastive Language-Image Pretraining)
# to embed the text query and compare it against image CLIP embeddings.

def search_by_text(query: str, media_list: list) -> list:
    """
    Mocks semantic search by looking for keywords in captions, 
    or just returns a subset for UI demonstration.
    """
    query_lower = query.lower()
    results = []
    
    for media in media_list:
        # Check if the mock caption (from BLIP) contains the query
        caption = media.get("captions", "")
        if caption and query_lower in caption.lower():
            results.append(media)
            continue
            
        # Check emotion tags
        emotions = media.get("emotions", {})
        dominant = emotions.get("dominant_emotion", "")
        if dominant and dominant.lower() in query_lower:
            results.append(media)
            continue
            
        # Fallback random subset for mock purposes if it's a generic term
        if "dance" in query_lower or "stage" in query_lower:
             results.append(media)
             
    # If no exact text match and it's a mock environment, just return some items
    if not results and media_list:
        return media_list[:2]
        
    return results
