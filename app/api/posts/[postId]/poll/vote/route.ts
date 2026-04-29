import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { postId: string } }
) {
  const poll = await db.poll.findUnique({
    where: { postId: params.postId },
    include: { options: { orderBy: { sortOrder: "asc" } } },
  });
  if (!poll) {
    return NextResponse.json({ success: false, error: "無投票" }, { status: 404 });
  }
  const session = await getServerSession(authOptions);
  let myVotes: string[] = [];
  if (session?.user) {
    const v = await db.pollVote.findMany({
      where: { pollId: poll.id, userId: session.user.id },
      select: { optionId: true },
    });
    myVotes = v.map((x) => x.optionId);
  }
  return NextResponse.json({ success: true, poll, myVotes });
}

export async function POST(
  req: Request,
  { params }: { params: { postId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "未登入" }, { status: 401 });
  }
  const poll = await db.poll.findUnique({
    where: { postId: params.postId },
    include: { options: true },
  });
  if (!poll) {
    return NextResponse.json({ success: false, error: "無投票" }, { status: 404 });
  }
  if (poll.closesAt && poll.closesAt < new Date()) {
    return NextResponse.json({ success: false, error: "投票已結束" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const optionIds: string[] = Array.isArray(body.optionIds) ? body.optionIds : [];
  if (optionIds.length === 0) {
    return NextResponse.json({ success: false, error: "至少選一個選項" }, { status: 400 });
  }
  if (!poll.multiSelect && optionIds.length > 1) {
    return NextResponse.json({ success: false, error: "此投票為單選" }, { status: 400 });
  }
  const valid = poll.options.map((o) => o.id);
  const filtered = optionIds.filter((id) => valid.includes(id));
  if (filtered.length === 0) {
    return NextResponse.json({ success: false, error: "選項無效" }, { status: 400 });
  }

  // 清掉舊票（單選/多選都重投）
  await db.pollVote.deleteMany({
    where: { pollId: poll.id, userId: session.user.id },
  });
  for (const optId of filtered) {
    await db.pollVote.create({
      data: { pollId: poll.id, optionId: optId, userId: session.user.id },
    });
  }
  // 重算 voteCount
  for (const opt of poll.options) {
    const c = await db.pollVote.count({ where: { optionId: opt.id } });
    await db.pollOption.update({ where: { id: opt.id }, data: { voteCount: c } });
  }

  // 投票積分
  const { earnPointsSafe } = await import("@/lib/points-engine");
  await earnPointsSafe({
    userId: session.user.id,
    action: "vote_join",
    relatedId: poll.id,
    relatedType: "post",
  });

  return NextResponse.json({ success: true, voted: filtered });
}
