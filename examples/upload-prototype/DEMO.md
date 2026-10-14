# Manual demo — upload prototype

From the repository root, run `npm install` once, then `npm run dev -w upload-prototype` and open the printed URL.

1. **Baseline.** Choose a few files. Rows go from "Uploading…" to "Uploaded". This is the prototype as built.
2. **Open the controller.** Click **Prototype controller** (bottom right). **Explore** lists the flow's scenarios. "User may not upload" is **Blocked** because its state is still unmapped (the designer provides it later).
3. **Partial failure.** Click **Activate** on "One of three files fails". Pick 3 files in the prototype. After about 1 s, 2 files are uploaded and the third shows the designer's error notice.
4. **Recover in the prototype.** Click **Retry upload** in the notice, not in the panel. Only the failed file goes back to "Uploading…" and then finishes. The other two never change.
5. **Reset.** Click **Reset to baseline**. The list is empty and the prototype runs as built again.
6. **Preview states.** Under **States**, click **Preview** on `upload.file-list / loading` to see the generated loading state. Then click **Preview** on `file-too-large`: a conflict message appears, and the first preview stays. Click **Clear preview**.
7. **Controllable loading.** Activate "Uploads stay in progress until finished", pick files, and click **Finish uploads** when you are ready.
8. **Present.** Switch to **Present** and click **Start presentation**. Use **Next** to step forward. At "Retry the failed file", Next waits until you click **Retry upload** in the prototype. **Previous** rebuilds the earlier step exactly.
9. **Keyboard.** Tab through the panel. Press **Escape** to close it; focus returns to the toggle.
10. **Off switch.** Set `VITE_PROTOTYPE_CONTROLLER=off` in `.env.development`, or run `npm run build -w upload-prototype`. The panel and scenarios are absent.
