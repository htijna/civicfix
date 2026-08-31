import re
import urllib.request
import io
import numpy as np
import cv2
from PIL import Image
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline

# Training Data
TRAIN_DATA = [
    # Road Damage
    ("huge pothole on the main road", "Road Damage", "Roads and Public Works"),
    ("deep potholes causing accidents", "Road Damage", "Roads and Public Works"),
    ("footpath is broken and unsafe", "Road Damage", "Roads and Public Works"),
    ("bridge structural damage", "Road Damage", "Roads and Public Works"),
    ("road is cracked and damaged", "Road Damage", "Roads and Public Works"),
    ("asphalt pothole crack on street", "Road Damage", "Roads and Public Works"),
    
    # Garbage Overflow
    ("garbage overflowing from the bin", "Garbage Overflow", "Waste Management"),
    ("illegal dumping of waste", "Garbage Overflow", "Waste Management"),
    ("trash is everywhere in the street", "Garbage Overflow", "Waste Management"),
    ("sewage waste dumped near park", "Garbage Overflow", "Waste Management"),
    ("plastic heap smelly waste pile", "Garbage Overflow", "Waste Management"),
    
    # Broken Streetlight
    ("streetlight is broken", "Broken Streetlight", "Electrical and Streetlights"),
    ("no light on the street at night", "Broken Streetlight", "Electrical and Streetlights"),
    ("electric wire hanging dangerously", "Broken Streetlight", "Electrical and Streetlights"),
    ("street lamp not working", "Broken Streetlight", "Electrical and Streetlights"),
    ("dark street lamp posts out", "Broken Streetlight", "Electrical and Streetlights"),
    
    # Water Leakage
    ("pipe is leaking water", "Water Leakage", "Water Authority"),
    ("main water supply pipe broke", "Water Leakage", "Water Authority"),
    ("tap is broken and flooding", "Water Leakage", "Water Authority"),
    ("water leakage in the residential area", "Water Leakage", "Water Authority"),
    ("burst pipe gushing water", "Water Leakage", "Water Authority"),
    
    # Park Maintenance
    ("park is dirty and needs maintenance", "Park Maintenance", "Parks and Recreation"),
    ("playground equipment is broken", "Park Maintenance", "Parks and Recreation"),
    ("fallen tree in the garden", "Park Maintenance", "Parks and Recreation"),
    ("overgrown grass branches in kids play area", "Park Maintenance", "Parks and Recreation"),
]

class ComplaintAnalyzer:
    def __init__(self):
        # Create pipeline: TF-IDF followed by Naive Bayes classifier
        self.category_model = make_pipeline(TfidfVectorizer(stop_words='english'), MultinomialNB())
        
        # Prepare data
        X = [item[0] for item in TRAIN_DATA]
        y_cat = [item[1] for item in TRAIN_DATA]
        
        # Train category model
        self.category_model.fit(X, y_cat)
        
        # Department mapping
        self.dept_map = {item[1]: item[2] for item in TRAIN_DATA}

    def detect_text_priority(self, text):
        text = text.lower()
        if re.search(r"danger|accident|fire|collapse|injury|critical|emergency|fatal|electric shock", text):
            return "Critical", 0.95
        if re.search(r"urgent|unsafe|major|blocked|overflow|high|severe|leaking", text):
            return "High", 0.80
        if re.search(r"minor|small|low|slight|dirty", text):
            return "Low", 0.30
        return "Medium", 0.60

    def analyze_image(self, url):
        """Downloads the image and performs visual analysis using PIL and OpenCV."""
        try:
            req = urllib.request.Request(
                url, 
                headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CivicFix/1.0'}
            )
            with urllib.request.urlopen(req, timeout=5) as response:
                image_bytes = response.read()
                
            pil_img = Image.open(io.BytesIO(image_bytes))
            img_np = np.array(pil_img)
            
            # Convert RGB/RGBA to BGR for OpenCV
            if len(img_np.shape) == 3:
                if img_np.shape[2] == 4:
                    img_cv = cv2.cvtColor(img_np, cv2.COLOR_RGBA2BGR)
                else:
                    img_cv = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)
            elif len(img_np.shape) == 2:
                img_cv = cv2.cvtColor(img_np, cv2.COLOR_GRAY2BGR)
            else:
                raise ValueError("Unsupported image array shape")

            # 1. Brightness / Luminance
            gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
            brightness = float(np.mean(gray))

            # 2. Edge / Texture Complexity
            laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
            canny_edges = cv2.Canny(gray, 50, 150)
            edge_density = float(np.sum(canny_edges > 0) / canny_edges.size)

            # 3. HSV Color Space Analysis
            small_img = cv2.resize(img_cv, (32, 32))
            hsv = cv2.cvtColor(small_img, cv2.COLOR_BGR2HSV)
            h, s, v = cv2.split(hsv)

            # Detect gray/dark/brown tones (asphalt/soil)
            gray_mask = (s < 60) & (v > 20) & (v < 180)
            gray_percentage = float(np.sum(gray_mask) / gray_mask.size)

            # Detect green hues (park foliage/grass)
            green_mask = (h >= 35) & (h <= 85) & (s > 35) & (v > 30)
            green_percentage = float(np.sum(green_mask) / green_mask.size)

            # Detect blue hues (flooding water)
            blue_mask = (h >= 85) & (h <= 135) & (s > 35) & (v > 30)
            blue_percentage = float(np.sum(blue_mask) / blue_mask.size)

            return {
                "success": True,
                "brightness": brightness,
                "laplacian_var": laplacian_var,
                "edge_density": edge_density,
                "gray_percentage": gray_percentage,
                "green_percentage": green_percentage,
                "blue_percentage": blue_percentage,
                "resolution": f"{pil_img.width}x{pil_img.height}"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def analyze_location(self, location):
        """Analyzes geographic coordinates and address metadata."""
        if not location:
            return {"success": False, "reason": "No location data provided"}

        address = location.get("address", "").lower()
        ward = location.get("ward", "")
        landmark = location.get("landmark", "").lower()
        lat = location.get("latitude")
        lon = location.get("longitude")

        # Proximity heuristics
        risk_score = 0.5
        features = []

        if re.search(r"school|college|university|hospital|clinic|nursing home|medical center", address + " " + landmark):
            risk_score += 0.25
            features.append("High-pedestrian/Sensitive Zone (School/Hospital)")
        
        if re.search(r"main road|highway|junction|crossroad|flyover|bridge|expressway", address + " " + landmark):
            risk_score += 0.20
            features.append("Traffic Infrastructure (Main Road/Highway)")

        if re.search(r"park|playground|garden|lake|pond|river", address + " " + landmark):
            features.append("Recreational / Water Body zone")

        return {
            "success": True,
            "ward": ward,
            "landmark": location.get("landmark", ""),
            "coordinates": f"{lat}, {lon}" if lat and lon else "Not available",
            "risk_score": min(risk_score, 1.0),
            "features": features
        }

    def analyze(self, title, description, images=None, location=None):
        text = f"{title} {description}".lower()
        
        # 1. Text Classification
        probs = self.category_model.predict_proba([text])[0]
        max_prob_idx = probs.argmax()
        confidence = probs[max_prob_idx]
        predicted_category = self.category_model.classes_[max_prob_idx]

        # 2. Text Priority Heuristics
        text_priority, severity_weight = self.detect_text_priority(text)

        # 3. Image Analysis
        image_metrics = None
        has_image = False
        if images and len(images) > 0:
            # Analyze the first image
            img_url = images[0]
            image_metrics = self.analyze_image(img_url)
            if image_metrics.get("success"):
                has_image = True

        # 4. Location Analysis
        loc_metrics = self.analyze_location(location)

        # 5. AI Decision Layer (Integrate features)
        # Modify prediction based on visual features if confidence is moderately low or close
        if has_image:
            # High edge density + dark colors increases road damage confidence
            if predicted_category == "Road Damage" and image_metrics["edge_density"] > 0.05:
                confidence = min(confidence + 0.15, 1.0)
            
            # Low brightness confirms streetlights
            elif predicted_category == "Broken Streetlight" and image_metrics["brightness"] < 70:
                confidence = min(confidence + 0.20, 1.0)
                severity_weight = max(severity_weight, 0.85) # Escalate severity at night

            # Green color distribution matches park maintenance
            elif predicted_category == "Park Maintenance" and image_metrics["green_percentage"] > 0.20:
                confidence = min(confidence + 0.10, 1.0)

            # High edge complexity could indicate trash heaps
            elif predicted_category == "Garbage Overflow" and image_metrics["edge_density"] > 0.06:
                confidence = min(confidence + 0.10, 1.0)

        # Fallback category checks
        if confidence < 0.20:
            predicted_category = "Other"
            department = ""
        else:
            department = self.dept_map.get(predicted_category, "")

        # Calculate final severity based on weights
        # Blend text priority weight, image urgency, and location risk
        location_risk = loc_metrics.get("risk_score", 0.5) if loc_metrics.get("success") else 0.5
        
        # If dark night broken streetlight OR high edge road damage, bump severity weight
        if has_image:
            if predicted_category == "Broken Streetlight" and image_metrics["brightness"] < 60:
                severity_weight = max(severity_weight, 0.90)
            if predicted_category == "Road Damage" and image_metrics["laplacian_var"] > 250:
                severity_weight = max(severity_weight, 0.85)

        # Apply location risk boost
        final_weight = (severity_weight * 0.6) + (location_risk * 0.4)
        
        if final_weight >= 0.80:
            final_severity = "Critical"
        elif final_weight >= 0.60:
            final_severity = "High"
        elif final_weight >= 0.35:
            final_severity = "Medium"
        else:
            final_severity = "Low"

        # 6. Generate Title and Description if missing or when derived from image
        derived_title = title
        derived_description = description

        if has_image and (not title or not description or title.strip() == "" or description.strip() == ""):
            # Auto-synthesize title and description from visual patterns and location
            loc_hint = ""
            if loc_metrics.get("success"):
                if loc_metrics.get("landmark"):
                    loc_hint = f" near {loc_metrics['landmark']}"
                elif loc_metrics.get("ward"):
                    loc_hint = f" in {loc_metrics['ward']}"

            if predicted_category == "Road Damage":
                if image_metrics.get("laplacian_var", 0) > 250:
                    gen_title = f"Severe road pothole / asphalt damage{loc_hint}"
                    gen_desc = f"Visual inspection indicates severe road surface cracking and pothole formation{loc_hint}. Poses a traffic safety hazard and requires immediate repair."
                else:
                    gen_title = f"Damaged road surface / pothole reported{loc_hint}"
                    gen_desc = f"Identified asphalt and road surface deterioration{loc_hint}. Requires resurfacing and inspection by Public Works."
            elif predicted_category == "Broken Streetlight":
                if image_metrics.get("brightness", 100) < 60:
                    gen_title = f"Non-functional street light / dark area{loc_hint}"
                    gen_desc = f"Critical streetlight outage detected with low ambient lighting conditions{loc_hint}. Urgent electrical maintenance requested for pedestrian safety."
                else:
                    gen_title = f"Broken streetlight fixture{loc_hint}"
                    gen_desc = f"Damaged street lighting pole / fixture observed{loc_hint}. Needs inspection and bulb or electrical unit replacement."
            elif predicted_category == "Garbage Overflow":
                gen_title = f"Garbage overflow and solid waste accumulation{loc_hint}"
                gen_desc = f"Heavy refuse and waste pile observed causing unsanitary conditions{loc_hint}. Prompt waste clearance and bin sanitation required."
            elif predicted_category == "Water Leakage":
                gen_title = f"Water leakage / pipe burst issue{loc_hint}"
                gen_desc = f"Water accumulation and visible leakage reported{loc_hint}. Water supply pipeline maintenance required to prevent wastage and waterlogging."
            elif predicted_category == "Park Maintenance":
                gen_title = f"Public park / recreation area maintenance required{loc_hint}"
                gen_desc = f"Overgrowth, debris or damaged equipment observed in public garden/park area{loc_hint}. Landscaping and sanitation requested."
            else:
                gen_title = f"Civic issue reported{loc_hint}"
                gen_desc = f"Civic issue documented via photo evidence{loc_hint}. Please review and dispatch the appropriate local municipal team."

            if not derived_title or derived_title.strip() == "":
                derived_title = gen_title
            if not derived_description or derived_description.strip() == "":
                derived_description = gen_desc

        # 7. Generate detailed AI explanation
        ai_description = f"### 🤖 AI Decision Layer Summary\n"
        ai_description += f"- **Target Classification:** **{predicted_category}** (Confidence: {confidence:.0%})\n"
        ai_description += f"- **Assigned Department:** `{department or 'Unassigned (Admin Review Needed)'}`\n"
        ai_description += f"- **Determined Severity:** **{final_severity}** (Risk Coefficient: {final_weight:.2f})\n\n"

        ai_description += "#### 📷 Visual Analysis Report\n"
        if has_image:
            ai_description += f"  - **Luminance:** {image_metrics['brightness']:.1f} / 255.0 "
            if image_metrics['brightness'] < 60:
                ai_description += "(⚠️ Dark / Night conditions detected)\n"
            elif image_metrics['brightness'] > 200:
                ai_description += "(Bright / Direct light conditions)\n"
            else:
                ai_description += "(Standard daylight conditions)\n"

            ai_description += f"  - **Texture Complexity (Edge Density):** {image_metrics['edge_density']:.1%} "
            if image_metrics['edge_density'] > 0.05:
                ai_description += "(⚠️ Significant surface irregularity / structural noise detected)\n"
            else:
                ai_description += "(Standard structural density)\n"

            ai_description += f"  - **Dominant Hue Distribution:** "
            hues = []
            if image_metrics['gray_percentage'] > 0.15:
                hues.append(f"Gray/Asphalt Tones ({image_metrics['gray_percentage']:.1%})")
            if image_metrics['green_percentage'] > 0.15:
                hues.append(f"Vegetation/Green ({image_metrics['green_percentage']:.1%})")
            if image_metrics['blue_percentage'] > 0.15:
                hues.append(f"Water/Blue ({image_metrics['blue_percentage']:.1%})")
            
            ai_description += ", ".join(hues) if hues else "Uniform/Indeterminate"
            ai_description += "\n"
        else:
            if images and len(images) > 0:
                ai_description += f"  - ⚠️ Image analysis skipped. Reason: `{image_metrics.get('error', 'Download timeout')}`\n"
            else:
                ai_description += "  - No complaint images uploaded for analysis.\n"

        ai_description += "\n#### 📍 Geospatial Context\n"
        if loc_metrics.get("success"):
            ai_description += f"  - **Geographic Area:** Ward: {loc_metrics['ward'] or 'Unknown'} | Landmark: {loc_metrics['landmark'] or 'None'}\n"
            if loc_metrics["features"]:
                ai_description += f"  - **Identified Zone Features:** {', '.join(loc_metrics['features'])}\n"
            else:
                ai_description += "  - **Identified Zone Features:** Standard residential/commercial zone\n"
            ai_description += f"  - **Coordinates:** `{loc_metrics['coordinates']}`\n"
        else:
            ai_description += "  - ⚠️ Geographic metadata unavailable.\n"

        ai_description += f"\n*Decision logic based on Scikit-learn MultinomialNB text predictions combined with OpenCV visual heuristics and Geographic zone checks.*"

        return {
            "title": derived_title,
            "description": derived_description,
            "category": predicted_category,
            "department": department,
            "severity": final_severity,
            "priority": final_severity, # Aligning both fields
            "confidence": float(confidence),
            "reason": f"AI routed to {department} with {confidence:.0%} confidence" if department else "Low confidence, routing exception",
            "aiReport": ai_description
        }

# Global instance initialized on startup
analyzer = ComplaintAnalyzer()

