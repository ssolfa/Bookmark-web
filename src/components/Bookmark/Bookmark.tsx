import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { deletePlaceBookmark } from '@/apis/detetePlaceBookmark';
import { getPlaceBookmark } from '@/apis/getPlaceBookmark';
import { postPlaceBookmark } from '@/apis/postPlaceBookmark';
import bookmarkActive from '@/assets/SpacePage/activeBookmarkIcon.svg';
import bookmarkDefault from '@/assets/SpacePage/bookmarkIcon.svg';

import { IconButton } from './Bookmark.style';

interface BookmarkButtonProps {
  placeId: number;
}

interface BookmarkResponse {
  isSuccess: boolean;
  code: string;
  message: string;
  result: {
    placeId: number;
    isSaved: boolean;
  };
}

export const Bookmark = ({ placeId }: BookmarkButtonProps) => {
  const queryClient = useQueryClient();

  const { data: bookmarkStatus } = useQuery({
    queryKey: ['bookmark', placeId],
    queryFn: () => getPlaceBookmark(placeId),
  });

  const { mutate: toggleBookmark } = useMutation({
    mutationFn: async () => {
      if (bookmarkStatus?.result.isSaved) {
        return await deletePlaceBookmark(placeId);
      }
      return await postPlaceBookmark(placeId);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['bookmark', placeId] });

      const previousBookmark = queryClient.getQueryData<BookmarkResponse>(['bookmark', placeId]);

      queryClient.setQueryData<BookmarkResponse>(['bookmark', placeId], (old) => {
        if (!old) return previousBookmark;

        return {
          ...old,
          result: {
            ...old.result,
            isSaved: !old.result.isSaved,
          },
        };
      });

      return { previousBookmark };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousBookmark) {
        queryClient.setQueryData<BookmarkResponse>(['bookmark', placeId], context.previousBookmark);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmark', placeId] });
    },
  });

  const handleClick = () => {
    if (!bookmarkStatus) return;
    toggleBookmark();
  };

  return (
    <IconButton onClick={handleClick}>
      <img src={bookmarkStatus?.result.isSaved ? bookmarkActive : bookmarkDefault} alt="북마크" />
    </IconButton>
  );
};
