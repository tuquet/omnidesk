---
name: automa-workflow-best-practices
description: Core guidelines and rules for creating, modifying, and reviewing Automa workflows JSON files. Triggers on: automa, workflow json, automa json, review workflow.
---

# Automa Workflow Best Practices (Baseline Rule)

When asked to review, modify, or create an Automa workflow JSON file, you MUST adhere to the following strict guidelines to ensure code quality, readability, and consistency across the agent ecosystem.

## 1. The 8 Mandatory Baseline Nodes
Every standard workflow must inherit from the baseline template which contains 8 mandatory nodes indicating the life cycle of the process. If a specific request is to create a new automated flow (e.g., auto-login Facebook), you must **insert the new action nodes BETWEEN** these baseline nodes (specifically inside the loop or where appropriate).

The 8 baseline nodes are typically:
1. `trigger` (Khởi tạo)
2. `new-tab` (Mở tab mới)
3. `loop-data` (Bắt đầu vòng lặp)
4. `element-scroll` (Cuộn trang)
5. `delay` (Nghỉ giữa hiệp)
6. `loop-breakpoint` (Kết thúc vòng lặp)
7. `notification` (Thông báo hoàn thành)
8. `close-tab` (Đóng tab dọn dẹp)

## 2. Descriptive Nodes and Edges
- **Nodes**: EVERY node in the workflow JSON must have a clear `description` field that explains exactly what the action does in the context of the user's business requirement. Do NOT leave description fields empty or use generic terms.
- **Edges**: EVERY edge connecting two nodes should ideally have a descriptive `label`. The label should clarify the condition or the flow (e.g., "Tiến hành đăng nhập", "Kiểm tra thành công"). 
- **Edge Visuals (Color/Animation)**: Ensure the edge flows are visually reasonable. Use `animated: true` or relevant edge configurations to distinguish critical paths or asynchronous wait times so it accurately reflects the user's request.

## 3. Mandatory Trigger Parameters for Reusability
- To ensure a workflow is highly reusable (e.g., easily duplicating or passing values from external APIs), the `trigger` node **MUST ALWAYS** define mandatory parameters (parameters array).
- Example: A Facebook login workflow cannot have hardcoded username and password in the nodes. They must be defined as variables in the trigger node (e.g., `fb_username`, `fb_password`), and then referenced inside the workflow using `{{variables.fb_username}}`.

## 4. Review Checklist
When reviewing a user's workflow file, agents must evaluate the following:
1. **Structure Check**: Does the workflow preserve the 8 baseline lifecycle nodes?
2. **Logic Check**: Are the new nodes logically placed inside the baseline (e.g., how many nodes need to be inserted to fulfill an Auto Login task)?
3. **Documentation Check**: Does each new node and edge have a detailed description explaining its intent?
4. **Reusability Check**: Are all variable inputs extracted to the trigger node as mandatory parameters?
