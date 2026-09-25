"use client";

import { GameLobby } from "@/components/games/GameLobby";
import { WS_PATH } from "@/lib/tienlen";

export default function TienLenLobbyPage() {
  return (
    <GameLobby
      title="Tiến Lên Miền Nam"
      tagline="Tạo bàn, vào bàn đang chờ, hoặc xem người khác chơi."
      icons="♠ ♥ ♣ ♦"
      basePath="/tien-len"
      wsPath={WS_PATH}
      apiPrefix=""
      maxPlayers={4}
      rules={
        <ul className="list-disc space-y-1 pl-5">
          <li>3 nhỏ nhất, 2 (heo) lớn nhất; chất ♠ &lt; ♣ &lt; ♦ &lt; ♥.</li>
          <li>Bộ: rác, đôi, sám cô, sảnh (≥3 lá, không có 2), đôi thông (≥3 đôi), tứ quý.</li>
          <li>Chặn bằng bộ cùng loại, cùng số lá và lá cao nhất lớn hơn.</li>
          <li>3 đôi thông chặt heo; tứ quý chặt heo, đôi heo, 3 đôi thông; 4 đôi thông chặt tất cả những bộ đó.</li>
          <li>Đã bỏ lượt thì không được đánh lại tới hết vòng. Không có bài nào chặn được thì tự động bỏ lượt.</li>
          <li>Tới trắng: tứ quý heo, sảnh rồng, 6 đôi, 5 đôi thông.</li>
          <li>Điểm: Nhất +2, Nhì +1 — 4 người +2/+1/−1/−2 · 3 người +2/+1/−3 · 2 người +2/−2 · tới trắng +2 từ mỗi người.</li>
          <li>Chặt heo: người bị chặt trả cho người chặt — heo đen (♠♣) 1 điểm, heo đỏ (♦♥) 2 điểm, chặt chồng (chặt 3 đôi thông / tứ quý) 2 điểm.</li>
        </ul>
      }
    />
  );
}
