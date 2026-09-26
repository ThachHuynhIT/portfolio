# Mèo Nổ — bộ prompt vẽ tranh lá bài

Mỗi lá bài Mèo Nổ có thể có một tranh riêng. Lá nào chưa có tranh vẫn hiện mặt vẽ bằng màu + emoji như cũ, nên bạn thêm dần từng lá cũng được.

## Cách dùng

1. Vẽ hoặc tạo tranh bằng công cụ AI tạo ảnh (Midjourney, DALL·E / ChatGPT, Ideogram, Stable Diffusion, Gemini…). Với mỗi lá: dán **đoạn phong cách chung** ở dưới, rồi thêm **prompt riêng** của lá đó.
2. Lưu file vào `art/meono/` và **đặt tên theo mã lá**, ví dụ `art/meono/defuse.png`, `art/meono/nope.jpg`. Mặt sau lá bài là `back.png`. Nhận `.png`, `.jpg`, `.jpeg`, `.webp`, `.avif`.
3. Chạy:

   ```bash
   npm install          # lần đầu, để có sharp
   npm run art:meono
   ```

   Script sẽ cắt tranh về tỉ lệ 5:7 (giữ phần “đáng chú ý” nhất), thu về 400×560, lưu thành `public/games/meono/cards/<mã>.webp` và cập nhật `src/lib/meono/art.ts`. Nó cũng in ra lá nào còn thiếu tranh.
4. Commit `public/games/meono/cards/*.webp` và `src/lib/meono/art.ts`. (Thư mục `art/` chứa ảnh gốc, nặng, nên đã nằm trong `.gitignore`.)

Muốn thay tranh thì ghi đè file trong `art/meono/` rồi chạy lại. Muốn bỏ tranh của một lá thì xoá file `.webp` của lá đó rồi chạy lại.

### Mẹo để bộ bài đồng bộ

- **Đừng để chữ trong tranh.** Game tự in tên lá ở dải trên cùng và biểu tượng gói ở góc dưới phải, nên chừa **khoảng 15% phía trên** và **góc dưới phải** tương đối trống/đơn giản.
- Tạo tranh ở tỉ lệ **5:7** (hoặc 2:3 / dọc). Midjourney: thêm `--ar 5:7`. Công cụ nào không chọn được tỉ lệ thì cứ tạo ảnh dọc, script sẽ tự cắt.
- Chọn **một** nhân vật mèo chủ đạo mà bạn thích nhất ở vài lá đầu, rồi dùng lại tranh đó làm ảnh tham chiếu (Midjourney `--cref` / `--sref`, ChatGPT “giữ đúng phong cách của ảnh này”…) cho các lá sau.
- Giữ nguyên seed/phong cách cho cả bộ; mỗi lá chỉ đổi phần “prompt riêng” và **màu chủ đạo** (màu đã khớp với màu lá hiện tại trong game để người chơi vẫn nhận ra lá).
- Tranh do bạn tự vẽ hoặc tự tạo. Không dùng tranh của bộ bài thương mại (Exploding Kittens…) vì đó là tác phẩm có bản quyền và repo/web này công khai.

## Đoạn phong cách chung (dán trước mỗi prompt)

```
Original illustration for a party card game about cats and bombs. Vertical playing-card artwork, 5:7 portrait.
Cute, funny cartoon style: chunky round cats with big expressive eyes, thick clean outlines, flat colours with soft cel shading,
simple bold shapes that read clearly at small size. One clear subject in the centre, plain softly-lit gradient background.
Leave the top 15% and the bottom-right corner simple and uncluttered. No text, no letters, no numbers, no logos, no border, no frame.
Original character designs, not imitating any existing card game or artist.
```

Không cần thêm gì nữa nếu công cụ cho phép chọn tỉ lệ. Với Midjourney thêm `--ar 5:7 --style raw` vào cuối.

## Prompt từng lá

Cột **Màu** là màu chủ đạo nên dùng cho nền/không khí của lá.

### Bộ cơ bản

| Mã (tên file) | Lá | Màu | Prompt riêng |
|---|---|---|---|
| `exploding` | 💣 Mèo Nổ | đen than → đỏ rượu | A startled cat sitting on top of a big round cartoon bomb with a lit, sparkling fuse, fur standing on end, tiny explosion sparks around; dark charcoal-to-crimson background, dramatic rim light. Funny, not gory. |
| `defuse` | 🧯 Gỡ bom | xanh chanh → xanh ngọc | A calm, confident cat in a tiny bomb-squad helmet cutting a wire on a bomb with little scissors, or holding a laser pointer that distracts the bomb; relieved sparkle; fresh lime-to-emerald background. |
| `attack` | ⚔️ Tấn công | cam → đỏ | A fierce little cat warrior leaping forward with a plastic sword and a saucepan helmet, battle cry face, motion lines; hot orange-to-red background. |
| `skip` | ⏭️ Bỏ lượt | xanh trời → xanh dương | A cat casually tiptoeing away past a sleeping bomb, whistling, holding a tiny "leaving" suitcase; sky-blue-to-blue background. |
| `favor` | 🙏 Xin xỏ | xám → xám đậm | A cat with huge pleading puppy eyes and paws pressed together, begging another off-screen cat for a card, sad sparkles; muted grey background. |
| `shuffle` | 🔀 Xáo bài | nâu hổ phách → vàng đậm | A cat spinning in a whirlwind of flying playing cards like a tornado, dizzy happy expression; amber-to-dark-gold background. |
| `future` | 🔮 Xem tương lai | hồng tím → hồng đậm | A mystic fortune-teller cat in a starry shawl gazing into a glowing crystal ball that shows three small blank cards; magenta-to-deep-pink background with sparkles. |
| `nope` | 🚫 Không! | đỏ → đỏ hồng | A very unimpressed cat raising one paw in a firm "stop" gesture, eyes half closed, big red forbidden-circle shape glowing behind it; red-to-rose background. |
| `taco` | 🌮 Mèo Taco | vàng → cam | A happy cat whose body is tucked inside a giant crunchy taco shell like a blanket, lettuce and tomato as decorations; sunny yellow-to-orange background. |
| `melon` | 🍉 Mèo Dưa Hấu | xanh lá → hồng | A round cat that is half watermelon — green striped rind back, pink juicy belly with seeds — sitting proudly; green-to-pink background. |
| `potato` | 🥔 Mèo Khoai Tây | vàng nhạt → vàng đất | A lumpy, potato-shaped cat with little sprouts on its head, sitting in a small pile of potatoes, content smile; pale-to-earthy-yellow background. |
| `beard` | 🧔 Mèo Râu | xám đá nhạt → xám đá | A dignified cat with an enormous, magnificent bushy beard that reaches the floor, holding a tiny comb; light stone-grey background. |
| `rainbow` | 🌈 Mèo Cầu Vồng | tím → xanh trời → xanh lá | A joyful cat sliding down a rainbow, leaving a sparkling rainbow trail from its tail; pastel violet-sky-green gradient background. |

### Gói Mèo Tự Huỷ (imploding)

| Mã | Lá | Màu | Prompt riêng |
|---|---|---|---|
| `imploding` | 🌀 Mèo Tự Huỷ | chàm → tím | A cat being sucked into a small swirling black hole / vortex that it made itself, stretched and spiralling, surprised face; deep indigo-to-violet cosmic background. |
| `reverse` | 🔁 Đảo chiều | xanh ngọc → xanh lơ | A cat doing a U-turn on a little scooter, tyre skid marks forming a circular arrow; teal-to-cyan background. |
| `bottom` | ⤵️ Rút từ đáy | xám xanh nhạt → xám xanh | A cat upside-down under a tall stack of cards, sneakily pulling the bottom card out with its paw, tongue out in concentration; slate background. |
| `feral` | 🐾 Mèo Hoang | xám đen → đen | A scruffy wild alley cat with a torn ear, glowing eyes and a mischievous grin, crouched on a trash can lid at night; near-black background with faint moonlight. |
| `alter` | 🪄 Sửa tương lai | tím → chàm | A wizard cat with a pointy hat rearranging three floating glowing cards with a magic wand; purple-to-indigo background with stars. |
| `targeted` | 🎯 Tấn công chỉ định | đỏ → cam đậm | A cat archer aiming a suction-cup arrow at a big target, one eye closed, very focused; red-to-dark-orange background. |

### Gói Mèo Chạy Rông (streaking)

| Mã | Lá | Màu | Prompt riêng |
|---|---|---|---|
| `superskip` | ⏩ Siêu bỏ lượt | xanh dương → chàm | A cat in a superhero cape blasting off like a rocket, leaving a speed trail, zooming past everything; blue-to-indigo background. |
| `swap` | 🔃 Đổi đầu đuôi | xanh lục bảo → xanh ngọc đậm | Two cats juggling, tossing one card from the top of a stack to the bottom and another back up in a circle; emerald-to-deep-teal background. |
| `catomic` | ☢️ Bom Mèo Nguyên Tử | vàng → xanh rêu | A cat in a comically oversized hazmat suit carrying a glowing green bomb with a big mushroom-shaped puff cloud behind it (cartoonish, harmless-looking); yellow-to-moss-green background. |
| `streaking` | 🏃 Mèo Chạy Rông | hồng → tím hồng | A gleeful cat running at full speed carrying a bomb in its arms like a football, wind in its fur; pink-to-fuchsia background. |
| `future5` | 🔭 Xem tương lai ×5 | tím nhạt → tím đậm | A cat astronomer peering through a large brass telescope, five small cards glowing in the starry sky like constellations; violet-to-dark-purple background. |
| `garbage` | 🗑️ Dọn rác | xám đá → xám đá đậm | A cat happily diving head-first into a trash can full of crumpled cards and fish bones, tail sticking out; stone-grey background. |
| `mark` | 🔖 Đánh dấu | vàng nhạt → cam | A detective cat with a magnifying glass sticking a big bookmark ribbon onto a card; warm amber-to-orange background. |
| `curse` | 🍑 Lời nguyền mông mèo | hồng nhạt → hồng đậm | A cat under a spooky purple curse cloud, blindfolded and fumbling with a fan of cards, the cloud shaped like a cat's rear end (cute, not rude); rose background. |

### Gói Mèo Sủa (barking)

| Mã | Lá | Màu | Prompt riêng |
|---|---|---|---|
| `barking` | 🐶 Mèo Sủa | vàng đậm → nâu hổ phách | A confused cat barking loudly like a dog, floppy dog-ear headband on, "woof" shock lines (no text); dark-gold-to-amber background. |
| `potluck` | 🍲 Góp nồi | cam → đỏ đậm | Several cat paws dropping mystery cards into a big bubbling stew pot, a cat chef stirring with a ladle; orange-to-dark-red background. |
| `ilt` | 🫳 Để đó cho tui | xanh ngọc → xanh lơ đậm | A sly cat reaching out a long paw to snatch a card out of the air just before another cat catches it; teal-to-dark-cyan background. |
| `alternow` | ⚡ Sửa tương lai ngay | hồng tím → tím đậm | A cat with crackling lightning paws rapidly rearranging three floating cards, electric sparks; fuchsia-to-deep-violet background. |
| `bury` | ⚰️ Chôn bài | xám → xám đậm | A cat gravedigger with a small shovel burying a face-down card in a pile of cards, solemn tiny candle; grey background. |
| `personal` | 🥊 Tự tấn công | đỏ nhạt → đỏ hồng đậm | A cat in boxing gloves accidentally punching itself, dizzy stars around its head, still smiling; red-to-deep-rose background. |
| `share` | 🤝 Chia sẻ tương lai | xanh trời → xanh dương đậm | Two cats sharing a pair of binoculars / looking together at three glowing cards, friendly vibe; sky-blue-to-navy background. |

### Gói Mèo Xác Sống (zombie)

| Mã | Lá | Màu | Prompt riêng |
|---|---|---|---|
| `zombie` | 🧟 Mèo Xác Sống | xanh chanh → xanh lá đậm | A cute zombie cat with stitches and a bandage, arms stretched forward, rising from a small grave mound, goofy not scary; lime-to-dark-green background. |
| `feed` | 🍖 Nuôi xác sống | đỏ hồng → đỏ đậm | Cats nervously tossing cards like snacks to a hungry cartoon zombie cat holding a bib; rose-to-dark-red background. |
| `dig` | ⛏️ Đào sâu | nâu hổ phách → vàng đất đậm | A miner cat with a headlamp and pickaxe digging down through layers of stacked cards; amber-to-dark-ochre background. |
| `clone` | 🧬 Nhân bản | xanh lơ → xanh ngọc đậm | A scientist cat stepping out of a glowing capsule next to an identical copy of itself, both surprised; cyan-to-dark-teal background. |
| `grave` | 🪦 Đào mộ | xám xanh → xám xanh đậm | A cat with a lantern digging up an old card from a tombstone-marked mound at night; slate background, soft moonlight. |
| `deadattack` | 🧟‍♂️ Xác sống tấn công | xanh lá → lục bảo rất đậm | A small horde of silly zombie cats charging forward together, arms out, one with a tiny flag; green-to-very-dark-emerald background. |
| `clairvoyance` | 👁️ Thấu thị | chàm nhạt → tím đậm | A cat with a glowing third eye on its forehead, seeing through a stack of cards to a tiny bomb hidden inside; indigo-to-deep-violet background. |

### Gói Tấn Công (attacking) và Phòng Thủ (defending)

| Mã | Lá | Màu | Prompt riêng |
|---|---|---|---|
| `slap` | 👋 Tát | cam nhạt → đỏ | A cat mid-slap with a big fluffy paw, the other cat's cheek squished, comic impact star (no text); orange-to-red background. |
| `annoy` | 😾 Nổi cáu | vàng → vàng hổ phách | An extremely grumpy cat with puffed fur, crossed arms and a tiny storm cloud above its head; yellow-to-amber background. |
| `steal` | 🦝 Cướp bài | xám nhạt → xám đậm | A masked bandit cat (raccoon-style eye mask) tiptoeing away with a card in a sack; light-to-dark grey background. |
| `rollcall` | 📋 Điểm danh mèo | đỏ → đỏ hồng rất đậm | A strict teacher cat with a clipboard and glasses, a line of round bombs standing in a row like students; red-to-very-dark-rose background. |
| `corn` | 🌽 Lời nguyền ngô pha lê | vàng nhạt → xanh rêu | A cat staring at a glowing, sparkling crystal corn cob that casts a mysterious curse aura; pale-yellow-to-moss-green background. |

### Mặt sau

| Mã | Lá | Màu | Prompt riêng |
|---|---|---|---|
| `back` | Mặt sau lá bài | nâu cam đỏ đậm | Card back design: a symmetrical pattern of a cute cat face and a small bomb in the centre, surrounded by repeating diagonal stripes and paw prints; rich burnt-orange and dark rust colours. Perfectly centred, decorative, symmetrical, works when tiled. |
