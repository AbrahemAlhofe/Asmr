"use client";

import { useEffect, useRef, useState } from "react";
import {
  Input,
  Button,
  Box,
  VStack,
  Heading,
  Flex,
  HStack,
  Avatar,
  Container,
  Text
} from "@chakra-ui/react";
import { Block } from "@/lib/types";
import YouTube, { YouTubePlayer } from 'react-youtube';
import { formatSecondsToTimestamp } from "@/lib/utils";

export default function Home() {
  const [url, setUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const player = useRef<YouTubePlayer | null>(null);
  const [analysis, setAnalysis] = useState([]);
  const [loading, setLoading] = useState(false);
  const [playerContainerHeight, setPlayerContainerHeight] = useState(0);
  const analysisRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {

    if (analysisRef.current != null) {
      const height = analysisRef.current.getBoundingClientRect().height;
      console.log(height);
      setPlayerContainerHeight(height);
    }

  }, [analysisRef, analysis])

  useEffect(() => {

    if ( url.length != 0 ) setVideoId(url.split("v=")[1]);

  }, [url])

  const handleAnalyze = async () => {
    setLoading(true); // Start loading
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const analysis = await response.json();
      setAnalysis(analysis);
    } catch (error) {
      console.error("Error analyzing:", error);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <HStack height="100vh" position={"relative"} dir="rtl" alignItems={"flex-start"}>
      <Box height={`${playerContainerHeight}px`} flexGrow={1} position={"sticky"} top={0} right={0} zIndex={1}>
        <VStack gap={4} p={8} top={0} position={"sticky"} >
          <HStack w="full">
            <Button
              colorScheme="teal"
              onClick={handleAnalyze}
              loading={loading}
              p={4}
            >
              حلل الحلقة
            </Button>
            <Input
              placeholder="أدخل رابط الحلقة"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              p={5}
              variant="subtle"
              dir="ltr"
            />
          </HStack>
          {videoId.length !== 0 && (
            <YouTube ref={player} videoId={videoId} />
          )}
        </VStack>
      </Box>
      <VStack ref={analysisRef} gap={4} p={8} w="55vw">
          {analysis.map((block: Block) => (
            <>
              <Heading as="h2" size="lg" mt={4} textAlign="start" cursor="pointer" w="full" onClick={() => player?.current.internalPlayer.seekTo(block.offset)} data-offset={block.offset}>
                <Text textDecoration="underline">{block.heading}</Text>
                <Text fontSize="sm" color="gray.500" fontWeight="medium" lineHeight="1.5em" mt={2}>{formatSecondsToTimestamp(block.offset)}</Text>
              </Heading>
              {block.body.map((item) => (
                <Box
                  p={6}
                  bg="gray.800"
                  borderRadius="md"
                  boxShadow="md"
                  maxHeight="70vh"
                  overflowY="auto"
                  dir="rtl"
                  w="full"
                >
                  <HStack>
                    <Avatar.Root>
                      <Avatar.Fallback />
                    </Avatar.Root>
                    <b>{item.role}</b>
                  </HStack>
                  <Box as="p" textAlign="justify">{item.text}</Box>
                  <Box mt={4} fontSize={"sm"} color="gray.500" fontWeight="medium" lineHeight="1.5em">
                    <Text>عدد الكلمات : {item.text.split(" ").length}</Text>
                  </Box>
                </Box>
              ))}
            </>
          ))}
      </VStack>
    </HStack>
  );
}
