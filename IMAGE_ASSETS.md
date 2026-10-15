# 상세페이지 이미지

## CEO 인물 사진 · 2026-10-15

### 현재 사용 사진

`public/assets/ceo-portrait-v2.png`는 사용자가 대표사진 교체용으로 새로 지정한 원본 PNG입니다. 원본 파일(1029×1529px, 1,940,699 bytes)을 그대로 복사해 CEO 인사말에 사용하고, 화면에서도 원본 비율을 유지합니다. 얼굴 보정이나 AI·유료 생성 작업은 하지 않았습니다.

### 이전 사용 이력

이전 파일 `public/assets/ceo-lee-myeong-gyu.jpg`는 사용자가 전달한 디자인 수정 요청서의 명함에서 인물 부분만 자른 사진입니다. 당시 사용자가 명함 속 인물이 CEO라고 확인하고 사진 게재를 요청했습니다. 원본 명함 이미지의 `(460, 24)` 위치에서 `274×320px` 영역을 잘라 JPEG로 저장했으며, 얼굴 생성·복원·외모 수정은 하지 않았습니다. 개인 연락처와 명함 문구는 포함하지 않았습니다. 이 명함 자르기 설명은 이전 사진의 제작 이력이며, 현재 사용하는 새 원본 PNG의 처리 방식이 아닙니다.

## 사업 설명 이미지 · 2026-10-08

Built-in `image_gen`으로 제작한 사업 설명용 실사 스타일 이미지입니다. 실제 유림 시설·직원·시공실적 또는 보유 장비의 사진을 증명하지 않습니다. 현장명이 붙는 실적 페이지에는 ‘적용 분야 이미지’ 표기를 표시합니다. 기존 실증 사진은 제공 PPT 자료에서 발췌한 실제 사진입니다.

| 파일 | 용도 | 크기 | 용량 |
|---|---|---:|---:|
| [public/assets/detail-water-plant.jpg](public/assets/detail-water-plant.jpg) | 소규모 수처리시설 | 1672×941 | 653,198 bytes |
| [public/assets/detail-smart-inspection.jpg](public/assets/detail-smart-inspection.jpg) | 시설·센서 점검 | 1672×941 | 386,960 bytes |
| [public/assets/detail-auger-site.jpg](public/assets/detail-auger-site.jpg) | 수평오거천공 | 1672×941 | 415,933 bytes |
| [public/assets/detail-water-quality.jpg](public/assets/detail-water-quality.jpg) | 수질 확인 | 1672×941 | 253,601 bytes |
| [public/assets/detail-livestock-facility.jpg](public/assets/detail-livestock-facility.jpg) | 축산시설 적용 분야 | 1600×900 | 372,227 bytes |
| [public/assets/detail-concrete-site.jpg](public/assets/detail-concrete-site.jpg) | 철근콘크리트공사 | 1600×900 | 437,976 bytes |
| [public/assets/detail-pipeline-site.jpg](public/assets/detail-pipeline-site.jpg) | 상하수도 관로공사 | 1600×900 | 473,520 bytes |

## 생성 프롬프트

### 소규모 수처리시설 · detail-water-plant.jpg

```text
Use case: photorealistic-natural
Asset type: wide website detail-page photograph used as an illustrative business image, not a record of any named company project.
Primary request: A convincingly real, small Korean municipal sewage-treatment facility in a green mountainous landscape similar to rural Yangpyeong, South Korea. Aerial or elevated oblique viewpoint, horizontal 16:9 composition, 2048x1152-style landscape framing.
Scene/backdrop: ordinary forested Korean foothills in late spring, maintained lawn, a modest low-rise grey maintenance building, a few realistically proportioned rectangular concrete treatment tanks with functional steel railings and simple pipework. Compact facility, not a huge industrial complex.
Composition/framing: wide documentary establishing photo; plant and building mainly in the right half, natural calm greenery with usable title space in the center-left. No rendered title or text.
Style/medium: photorealistic environmental engineering editorial photography. Real concrete pores and mild weathering, practical paths, slightly varied vegetation, physically plausible water and infrastructure, normal camera dynamic range.
Lighting/mood: honest daylight, soft natural shadows, neutral greens and greys.
Constraints: no people, no writing, no logos, no watermark, no identifiable named company or claimed real project.
Avoid: cinematic color grading, computer-generated architectural visualization, fantasy pristine surfaces, futuristic shapes, holograms, exaggerated dramatic mountains, perfect fake geometry.
```

### 시설·센서 점검 · detail-smart-inspection.jpg

```text
Use case: photorealistic-natural
Asset type: wide website detail-page editorial photograph illustrating smart facility management; not a record of any company employee or named real project.
Primary request: One Korean adult facility-management engineer naturally inspecting a real sewage-treatment facility's closed control cabinet and installed sensors using a rugged tablet. The engineer is seen from behind or a rear three-quarter angle, face unidentifiable. Horizontal 16:9 landscape, 2048x1152-style framing.
Scene/backdrop: a practical small wastewater-treatment utility area with a grey metal closed electrical control cabinet, protected pipes and ordinary wired field sensors, green foliage and concrete treatment infrastructure softly visible beyond.
Subject: one engineer wearing a properly fitted white safety helmet, normal grey workwear and high-visibility safety vest, safety boots. Natural stance, both hands plausibly holding the tablet while checking the installation. Keep cabinet doors closed; no touching exposed energized wiring.
Composition/framing: medium-wide documentary photograph, engineer and cabinet toward the right with calm real facility surroundings to the left. Practical human-scale equipment and truthful perspective.
Style/medium: photorealistic candid industrial editorial photo, real fabric wrinkles and equipment wear, natural textures, ordinary green and grey palette.
Lighting/mood: soft daylight, grounded and calm.
Constraints: no identifiable face, no readable text, no branding, no logos, no watermark. Tablet and small LCD viewed at an angle with dim understated non-legible interface; no invented large lettering.
Avoid: science-fiction holograms, glowing floating graphics, dramatic cinematic CG, polished 3D-render appearance, unphysical hands, extra people, open electrical hazard.
```

### 수평오거천공 · detail-auger-site.jpg

```text
Use case: photorealistic-natural
Asset type: editorial 16:9 landscape engineering service photograph for a Korean civil engineering website.
Primary request: A technically credible small horizontal auger boring jobsite, viewed from the side at an oblique angle so its horizontal alignment is unmistakable. This must be a traditional pit-launched horizontal auger boring machine, not a surface directional drilling rig or excavator.
Scene: A flat dry launch pit on a modest Korean civil works site. The pit has straight steel trench-box/shoring walls, stable compacted granular floor, a clear walk area and a ladder well away from the machinery. Green Korean hills are softly visible above the pit.
Subject: One simple compact low orange-and-dark-grey auger boring power carriage on two straight parallel steel base rails anchored on the flat pit floor. A round steel casing about 45 cm diameter extends perfectly horizontally from the machine toward a circular entry opening in the shored end wall. Machine rail direction, gearbox rotation axis, steel casing centerline and wall entry opening all share one clearly visible straight horizontal alignment. The auger flights are inside the casing rather than large exposed spinning blades. Real simple fabricated steel frame, compact hydraulic components, restrained hose routing, no fantasy parts. The machine is idle during inspection.
Supporting subject: One small engineer standing safely to the side of the idle machinery, wearing a white hard hat, high-visibility vest, gloves and safety boots, viewed from the back/side with no visible recognizable face. No one touching a rotating shaft or standing over a casing.
Style: Absolutely photorealistic editorial construction photography, believable human-scale machinery and natural soil/steel textures. No CGI look.
Composition: Wide landscape 16:9, eye-level view from a safe side position slightly above pit floor; machine occupies the lower-center half and the horizontal pipe alignment is clearly legible. Avoid clutter. Moderately wide 35mm photographic perspective, realistic proportions.
Lighting: Soft natural daylight, balanced forest green and warm steel/soil color palette, professional calm dependable mood.
Constraints: Generic service introduction imagery, not proof of an actual named project. No text, labels, numbers, logos, brands, watermarks, signs or markings. No excavator, no vertical drill, no angled HDD boom, no floating steel casing, no chaotic hoses, no unsupported deep earth walls, no dangerous operation.
```

### 수질 확인 · detail-water-quality.jpg

```text
Use case: photorealistic-natural
Asset type: Premium editorial landscape 16:9 environmental engineering service photograph for a Korean corporate website.
Primary request: A close, believable water quality inspection moment in a Korean riverside environmental facility. The focus is an environmental engineer's gloved hands holding one transparent sample bottle filled with clear water for visual inspection, with a gently flowing river and wooded mountains softly visible behind.
Scene: A safe maintained riverside sampling/inspection platform beside a modest environmental facility. A neat stainless-steel safety railing between the platform and the river is clearly visible; the engineer is standing securely on the landward side, never reaching over or climbing the railing. Korean wooded hills and river vegetation provide a natural forest-green backdrop, softly defocused.
Subject: Only the engineer's hands, forearms and a subtle cropped torso are visible. Clean light nitrile gloves, a practical muted forest-green technical work jacket, realistic sleeve cuffs. Both gloved hands support a simple clear cylindrical glass sample bottle near waist/chest height; it is roughly 70% filled with transparent water and has a small white cap set securely beside the hand or closed on the bottle. Bottle has no label, no gradations, no numbers. Sensible anatomically correct fingers and grip, truthful refraction and natural highlights in the glass and water.
Composition: The gloved hands and bottle occupy the left-center foreground, river, greenery and softly visible mountains extend across the right and background in a spacious 16:9 landscape. Photography at normal human height, 50mm lens feel, shallow but not excessive depth of field. Crop ends below the neck, no face or head visible. Keep realistic proportions and useful landscape composition for a website detail page.
Style/medium: Real editorial environmental field photography with natural textiles, glass and skin/glove texture; absolutely photorealistic, subtle and trustworthy, no laboratory fantasy.
Lighting: Soft daylight on an overcast-bright morning; gentle reflections on the sample bottle, muted forest greens, pale blue water and grey steel. Calm evidence-oriented professional mood.
Constraints: Generic business introduction imagery rather than documentation of a named real project. No logos, no text, no letters, no watermarks, no identifying signs, no recognizable location, no visible face. No unnatural luminous water, no impossible bottle geometry, no extra hands or fingers, no plastic-looking CG surfaces, no floating objects, no engineer leaning beyond a railing.
```

### 축산시설 적용 분야 · detail-livestock-facility.jpg

```text
Use case: photorealistic-natural
Asset type: generic application-sector illustration photograph, landscape 16:9, for Korean environmental engineering website project listing cards. Target visual dimensions 1600 by 900 pixels.
Primary request: A plausible working livestock facility exterior in the Korean countryside, with low modern agricultural barns, a maintained management access lane, greenery and wooded mountains in the background. The livestock species must remain unspecified.
Scene: An ordinary rural Korean livestock complex with one-story long low barns clad in subdued grey corrugated metal, conventional insulated roofs, practical ventilation equipment and modest overhangs. A clear narrow concrete management lane runs diagonally between two barns, with orderly drains at the edges, a few everyday non-identifying utility objects tucked close to the buildings, native grass and trees around the perimeter, softly visible wooded Korean hills beyond.
Style/medium: Real editorial documentary photography, believable practical working facility with realistic mild wear, faint rain marks, natural concrete and metal textures. Tidy and responsibly maintained but not impossibly spotless, futuristic, luxurious or polished like CGI.
Composition: Wide horizontal 16:9, human eye level, medium-wide three-quarter view from outside the barns; a large low barn clearly visible rather than distant empty landscape, access lane leads through the middle/right, green hills in the upper background. Balanced crop-friendly composition for project cards.
Lighting: Soft naturally bright daylight, lightly overcast sky, muted grey roofs and warm concrete balanced with forest greens, calm professional atmosphere.
Constraints: This is generic illustrative application imagery, not a portrait or documentation of any real named farm. No visible animals or animal silhouettes so no livestock species is implied. No identifiable people, no text, no numbers, no labels, no logos, no address signs, no farm name, no brand marks, no watermark, no identifiable real location. No manure piles, no dramatic industrial smoke, no glass skyscraper architecture, no uncanny synthetic surfaces.
```

### 철근콘크리트공사 · detail-concrete-site.jpg

```text
Use case: photorealistic-natural.
Asset type: a premium Korean civil engineering company's service detail page wide banner photo, 16:9 landscape.
Primary request: a realistic reinforced-concrete construction site in South Korea, viewed from a slightly elevated wide documentary photography angle. Show a plausible low-rise concrete civil structure being built with timber and modular steel formwork, realistic evenly spaced steel reinforcing bars tied into cages, a partially cured concrete slab, and a few construction workers appearing small in the scene. Workers wear proper hard hats, reflective high-visibility vests, safety boots and gloves; they stand and work in safe areas with ordinary guardrails around exposed edges.
Scene/backdrop: a grounded Korean suburban civil engineering site with an understated wooded hillside and forest background; site equipment and materials naturally organized, no dramatic skyline.
Lighting/mood: warm late-afternoon sunlight, quiet professional confidence, natural color and believable shadows.
Materials/textures: real weathered plywood, steel rebar, dusty concrete, compacted soil and natural foliage; editorial photography with realistic camera optics, no CGI aesthetic.
Composition/framing: wide 16:9 framing, foreground and middle-ground structure provide meaningful construction detail; leave calm uncluttered negative space near the upper part of the frame for webpage headings. People are secondary and small. No overlay graphics.
Constraints: generic illustrative business photography, not a claim of an actual company's project. No words, no letters, no numbers, no logos, no branding, no watermarks, no unsafe poses, no impossible architecture, no oversized or distorted machinery.
```

### 상하수도 관로공사 · detail-pipeline-site.jpg

```text
Use case: photorealistic-natural.
Asset type: premium Korean civil engineering company service detail page wide banner photography, 16:9 landscape.
Primary request: realistic municipal water and sewer pipeline installation site in South Korea. A wide documentary photograph from a slightly elevated viewpoint shows a sensible shallow-to-moderate excavation approximately 1.5 to 2 metres deep, protected by clearly visible steel trench shoring panels and horizontal braces. Large-diameter clean but naturally weathered concrete pipes lie aligned on compacted gravel bedding in the protected trench; one installed pipe section and a small number of pipe sections waiting beside the work area show the actual installation process.
Scene/backdrop: an ordinary tidy Korean suburban roadside construction area near low wooded hills. A compact excavator is positioned on solid ground set back at a safe distance from the excavation edge. A few workers are small within the wide scene, wearing hard hats, reflective safety vests, boots and gloves, standing outside the excavator's operating radius and away from the trench edge. The trench has practical protective barriers; no workers below suspended loads.
Lighting/mood: neutral natural daylight, clear realistic colors, calm professional company photography.
Materials/textures: believable granular soil, scattered rocks, compacted gravel, steel shoring panels, concrete pipes and worn metal machinery, photorealistic optics and grounded proportions.
Composition/framing: wide 16:9 landscape with meaningful pipeline and protected trench details, leave a calm uncluttered upper portion for page headings, balanced composition. Equipment and workers are secondary, not close-up.
Constraints: generic explanatory business photography, not a claim of any real company's construction project. No text, letters, numbers, logos, branding or watermarks. No unrealistic deep trench, no unshored vertical earth walls, no distorted machinery, no unsafe distances, no crowded action, no CGI look.

Targeted edit:
Edit target: the supplied wide Korean pipeline-construction photograph.
Change only one thing: remove every bit of lettering, numbering, logos, stickers, decals, and brand marks from the excavator, especially the tiny dark invented lettering on the upper boom. Make those areas plain natural yellow painted metal matching the adjacent weathered paint. Check the cab and body for tiny badges as well. Do not add any text anywhere.
Preserve all other image elements exactly: the wide 16:9 composition, the steel-shored trench, horizontal braces, aligned concrete pipes, three safety-equipped workers and their positions, soil and gravel textures, rural Korean houses and forest, daylight, machinery geometry and all colors outside the cleaned markings. Keep the photo fully photorealistic. No new objects, no watermark.
```
