# FBX Inspector Manual Verification

Automated browser tests cover the no-file shell, file entry point, invalid file feedback, and narrow viewport recovery. Real FBX rendering is manual unless a committed sample FBX asset is added later.

## Setup

- [ ] Run `npm run dev -- --port 5173`.
- [ ] Open `http://127.0.0.1:5173/` in a browser.
- [ ] Confirm the workbench shell renders with Scene, Viewport and animation, and Inspector panels.
- [ ] Confirm the file entry point is visible as `Choose or drop .fbx`.
- [ ] Confirm the viewport shows the no-file state and the status strip says `No file loaded`.

## Load A Real FBX

- [ ] Choose a local `.fbx` file with the file picker.
- [ ] Reload the page and drag the same `.fbx` into the drop zone.
- [ ] Confirm the model appears in the viewport for both entry paths.
- [ ] Confirm the status strip updates to the FBX filename and size.
- [ ] Confirm mouse orbit, pan, and zoom interactions move the camera without page scroll interference.
- [ ] Confirm the scene tree lists root nodes and descendants.
- [ ] Select at least one node from the scene tree and confirm the selected row is highlighted.

## Viewport Diagnostics

- [ ] Toggle Grid and confirm the ground grid appears or disappears.
- [ ] Toggle Axes and confirm axis helpers appear or disappear.
- [ ] Toggle Bounds and confirm bounding helpers appear or disappear.
- [ ] Toggle Skeleton on a skinned FBX and confirm skeleton helpers appear or disappear.
- [ ] Toggle Wireframe and confirm mesh rendering changes.
- [ ] Toggle Textures and confirm textured/material display changes.
- [ ] Toggle Normals and confirm normal helpers appear or disappear.
- [ ] Toggle Material Override and confirm the override display changes.
- [ ] Move the Exposure slider and confirm the viewport brightness changes.
- [ ] Click Screenshot and confirm a viewport image download is offered.

## Inspector Data

- [ ] On the Overview tab, confirm file and scene statistics are populated.
- [ ] On the Node tab, confirm selected node transform, hierarchy, or identity fields update after node selection.
- [ ] On a mesh node, confirm the Mesh tab appears and shows geometry attributes or draw statistics.
- [ ] On a material-backed mesh, confirm the Materials tab appears and shows material fields.
- [ ] On a textured mesh, confirm the Textures tab appears and shows texture metadata.
- [ ] On a skinned mesh, confirm the Skeleton tab appears and shows bone or bind data.
- [ ] Confirm the Raw tab is available and shows serialized object data.
- [ ] In each populated inspector table, confirm rows include Path, Value, Source, and Tip columns.
- [ ] Confirm copy buttons appear for copyable raw values and copy without throwing a browser error.

## Animation

- [ ] Use an FBX with animation clips.
- [ ] Confirm the timeline replaces the no-animation empty state.
- [ ] Confirm the Animation clip selector lists clips.
- [ ] Press Play, Pause, Stop, Previous frame, and Next frame and confirm playback state changes.
- [ ] Scrub the Animation time slider and confirm the model pose changes or the time display updates.
- [ ] Change Playback speed and confirm playback rate changes.
- [ ] Toggle Loop animation and confirm the checkbox state changes.
- [ ] Confirm timeline stats show track, key, and node counts.
- [ ] Confirm the Animation inspector tab appears and lists clip/track fields.

## Invalid File

- [ ] Choose a non-FBX file such as `.txt`, `.png`, or `.glb`.
- [ ] Confirm the status strip shows `Please choose a .fbx file.` or the current invalid file message.
- [ ] Confirm the previous model is cleared or the no-file viewport state is shown.
- [ ] Confirm the inspector does not show stale data for the rejected file.
