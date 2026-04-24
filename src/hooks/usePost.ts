import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function usePost(postId: string, initialLikes: number, initialLiked: boolean) {
  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [loading, setLoading] = useState(false);

  async function toggleLike() {
    if (loading) return;
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    if (liked) {
      await supabase.from("likes").delete()
        .eq("user_id", user.id).eq("post_id", postId);
      setLiked(false);
      setLikesCount((c) => c - 1);
    } else {
      await supabase.from("likes").insert({ user_id: user.id, post_id: postId });
      setLiked(true);
      setLikesCount((c) => c + 1);
    }
    setLoading(false);
  }

  return { liked, likesCount, toggleLike };
}

export function useFollow(targetId: string, initialFollowing: boolean) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  async function toggleFollow() {
    if (loading) return;
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    if (following) {
      await supabase.from("follows").delete()
        .eq("follower_id", user.id).eq("following_id", targetId);
      setFollowing(false);
    } else {
      await supabase.from("follows").insert({
        follower_id: user.id,
        following_id: targetId,
      });
      setFollowing(true);
    }
    setLoading(false);
  }

  return { following, toggleFollow };
}