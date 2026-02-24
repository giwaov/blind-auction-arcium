# OpenGradient SDK Documentation Audit

**Date:** February 13, 2026
**Scope:** https://docs.opengradient.ai/developers/sdk/ and related pages
**GitHub Issue:** https://github.com/OpenGradient/OpenGradient-SDK/issues/157

---

## 1. Settlement Mode Naming Mismatch

**Pages affected:**
- https://docs.opengradient.ai/developers/sdk/llm.html
- https://docs.opengradient.ai/developers/x402/
- https://docs.opengradient.ai/developers/x402/examples.html

**Issue:** The SDK and x402 docs use different names for the same settlement modes. The x402 examples page mixes both conventions in the same section.

| Concept | SDK name | x402 name |
|---|---|---|
| Immediate settle | `SETTLE` | `SETTLE_INDIVIDUAL` |
| Settle with metadata | `SETTLE_METADATA` | `SETTLE_INDIVIDUAL_WITH_METADATA` |
| Batch settle | `SETTLE_BATCH` | `SETTLE_BATCH` |

**Suggested fix:** Pick one naming convention and use it everywhere. If the SDK intentionally uses short names, add a mapping table showing the equivalences.

---

## 2. Default Settlement Mode Contradiction

**Pages affected:**
- https://docs.opengradient.ai/developers/sdk/llm.html
- https://docs.opengradient.ai/developers/x402/

**Issue:** SDK function signatures default to `SETTLE_BATCH`. The x402 gateway page states `SETTLE_INDIVIDUAL` is the default.

**Suggested fix:** Clarify that the defaults differ between the SDK and x402 gateway, or align them to one default. Add a note on each page stating what the other defaults to and why.

---

## 3. Model List Out of Sync

**Pages affected:**
- https://docs.opengradient.ai/developers/sdk/llm.html (9 models listed)
- https://docs.opengradient.ai/api_reference/python_sdk/ (16 models in enum)

**Issue:** Seven models present in the `TEE_LLM` enum are missing from the supported models list:

- `CLAUDE_3_7_SONNET`
- `GEMINI_2_0_FLASH`
- `GEMINI_2_5_FLASH_LITE`
- `GROK_2_1212`
- `GROK_2_VISION_LATEST`
- `GROK_4_1_FAST`
- `O4_MINI`

Additionally, there is no mapping between string identifiers (e.g. `openai/gpt-4.1`) and enum constants (e.g. `og.TEE_LLM.GPT_4_1_2025_04_14`).

**Suggested fix:** Either add the missing models to the LLM page's supported list, or mark them as deprecated/experimental in the API reference. Add a string-to-enum mapping table.

---

## 4. Missing Return Type Documentation

**Pages affected:**
- https://docs.opengradient.ai/developers/sdk/llm.html
- https://docs.opengradient.ai/api_reference/python_sdk/

**Issue:** `TextGenerationOutput` and `TextGenerationStream` are used as return types but their fields and properties are never documented. Users don't know what data is available on the response object or how to consume a stream.

**Suggested fix:** Add a section to the API reference documenting both classes — their fields (e.g. `text`, `payment_hash`, `usage`), types, and a code example showing how to iterate over `TextGenerationStream`.

---

## 5. Bug: Mutable Default Argument

**Page affected:**
- https://docs.opengradient.ai/developers/sdk/llm.html

**Issue:** The `client.llm.chat()` signature uses a mutable default:

```python
# Current (buggy)
tools: Optional[List[Dict]] = []

# Should be
tools: Optional[List[Dict]] = None
```

A mutable default argument in Python is shared across all calls to the function, which can cause unintended shared-state bugs.

**Suggested fix:** Change to `tools: Optional[List[Dict]] = None` in both the implementation and docs.

---

## 6. Typo: "initalize"

**Page affected:**
- https://docs.opengradient.ai/developers/sdk/model_management.html

**Issue:** Text reads: *"create_model automatically calls create_version to initalize v0.01"*

**Suggested fix:** Change "initalize" to "initialize".
