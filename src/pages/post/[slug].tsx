import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { getPrismicClient } from '../../services/prismic';

import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface LinkPost {
  first_publication_date: string | null;
  last_publication_date: string | null;
  uid?: string;
  data: {
    title: string;
  };
}

interface PostProps {
  post: Post;
  nextPost: LinkPost;
  previousPost: LinkPost;
  preview: boolean;
}

export default function Post({
  post, nextPost, previousPost, preview
}: PostProps) {
  const router = useRouter()

  if (router.isFallback) {
    return <p>Carregando...</p>
  }

  const numberOfWords = post.data.content.reduce((numberOfWords, section) => {
    const numberOfWordsInHeading = section.heading?.split(' ')?.length ?? 0;

    const numberOfWordsInBody = section.body.reduce((
      numberOfWordsInBody, paragraph
    ) => {
      return numberOfWordsInBody + paragraph.text.split(' ').length
    }, 0)

    return numberOfWords + numberOfWordsInHeading + numberOfWordsInBody;
  }, 0)

  const readingTime = Math.ceil(numberOfWords / 200);

  return (
    <>
      <Head>
        <script async defer src="https://static.cdn.prismic.io/prismic.js?new=true&repo=spacetraveling-marcel099" />
        <title>{post.data.title} | spacetraveling</title>
      </Head>
      <div className={`${commonStyles.pageContainer} ${styles.pageContainer}`}>
        <Header />
        <div className={styles.bannerContainer}>
          <img src={post.data.banner.url} alt="Banner" />
        </div>
        <main>
          <article className={styles.post}>
            <h1 className={styles.title}>
              {post.data.title}
            </h1>

            <div className={styles.info}>
              <div className={styles.createdAt}>
                <FiCalendar />
                <time dateTime="">
                  {
                    format(
                      new Date( post.first_publication_date ),
                      'dd MMM YYY',
                      { locale: ptBR }
                    )
                  }
                </time>
              </div>
              <div className={styles.author}>
                <FiUser />
                <span>
                  {post.data.author}
                </span>
              </div>
              <div className={styles.readingTime}>
                <FiClock />
                <span>
                  {readingTime} min
                </span>
              </div>
            </div>

            <main className={styles.postContent}>
              {post.data.content.map((section, idx) => {
                return (
                  <div key={idx}>
                    {section.heading && (
                      <h2>
                        {section.heading}
                      </h2>
                    )}
                    {section.body.map((paragraph, idx) => (
                      <p
                        key={idx}
                        className={styles.postParagraph}
                        dangerouslySetInnerHTML={{ __html: paragraph.text}}
                      />
                    ))}
                  </div>
                )
              })}
            </main>
          </article>
        </main>
      </div>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
    const prismic = getPrismicClient({});
    const postsResponse = await prismic.getByType('posts', {
      fetch: ['posts.title'],
      pageSize: 100,
    });

  const paths = postsResponse.results.map(result => ({
    params: {slug: result.uid}
  }))

  return {
    paths,
    fallback: true,
  }
};

export const getStaticProps: GetStaticProps<PostProps> = async ({ params, preview = false, previewData }) => {
  const {
    slug,
  } = params;

  if ( slug === 'favicon.png' ) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      }
    }
  }

  const prismic = getPrismicClient({});
  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const previousPostResponse = await prismic.getByType('posts',
    {
      fetch: ['posts.title'],
      pageSize: 2,
      after: String(response.id),
    }
  )

  const previousPost = previousPostResponse.results[0] ?? null

  const nextPostResponse = await prismic.getByType('posts',
    {
      fetch: ['posts.title'],
      pageSize: 2,
      after: String(response.id),
    }
  )

  const nextPost = nextPostResponse.results[0] ?? null

  return {
    props: {
      post: response,
      previousPost,
      nextPost,
      preview,
    },
    revalidate: 60 * 30,  // 30 minutes
  }
};