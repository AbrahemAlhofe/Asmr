import { Button, HStack, Input } from "@chakra-ui/react";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";

export const ActionInput = ({
  onAction,
  loading = false,
  disabled = false,
  onVideoIdChange,
}: {
  onAction: (videoId: string) => void;
  loading?: boolean;
  disabled?: boolean;
  onVideoIdChange: (videoId: string) => void;
}) => {
  const [url, setUrl] = useState("");
  const [videoId, setVideoId] = useState("");

  const searchParams = useSearchParams();

  useEffect(() => {
    const videoUrl = searchParams.get("video") || "";
    setUrl(videoUrl);
  }, [searchParams]);

  useEffect(() => {
    const isValidUrl = (url: string) => {
      const regex =
        /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=)?([a-zA-Z0-9_-]{11})/;
      return regex.test(url);
    };
    if (url.length !== 0 && isValidUrl(url)) {
      setVideoId(url.split("v=")[1]);
      onVideoIdChange(url.split("v=")[1]);
    }
    if (url.length === 0) {
      setVideoId("");
      onVideoIdChange("");
    }
  }, [url]);

  return (
    <HStack w="full">
      <Button
        colorScheme="teal"
        onClick={() => onAction(url)}
        p={4}
        loading={loading}
        disabled={disabled || videoId.length === 0}
      >
        حلل الحلقة
      </Button>
      <Input
        placeholder="( e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ )"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        p={5}
        variant="subtle"
        dir="ltr"
      />
    </HStack>
  );
};
