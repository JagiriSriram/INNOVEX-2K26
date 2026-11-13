"""Answers about the project/team ONLY from this fixed info (no guessing) - same rules as your dashboard."""
import re

P = {"name": "Smart Period Relief Belt", "leader": "Sriram", "members": ["Revathi", "Parshuram Reddy"]}
NO_INFO = "I don't have that project information available."


def project_answer(norm):
    """norm = normalised lowercase query. Returns text or None if not a project question."""
    if re.search(r"\b(hod|guide|mentor|college|jits|knr|sponsor|funding|price|cost|patent|budget|award)\b", norm):
        return NO_INFO
    if re.search(r"\b(leader|sriram)\b", norm):
        return f"{P['leader']} is the Team Leader of the {P['name']} project."
    m = re.search(r"\b(revathi|parshuram)\b", norm)
    if m:
        return f"{m.group(1).title()} is a team member of the {P['name']} project. The Team Leader is {P['leader']}."
    if re.search(r"\b(team|teammates?|members?|who (made|made it|developed|built|created))\b", norm):
        return f"Team Leader: {P['leader']}\n\nTeam Members:\n" + "\n".join("- " + m for m in P["members"])
    if re.search(r"\b(belt|device)\b.*\b(work|works|do|does|feature|features)\b|\bwhat is (this|the belt)\b", norm):
        return (f"The {P['name']} is a student-developed smart wearable that gives period-care comfort support: heat and "
                "vibration therapy, temperature monitoring with auto heater cut-off, an emergency stop, plus period, pain "
                "and hydration tracking in this app. It supports comfort - it does not treat any condition.")
    return None
