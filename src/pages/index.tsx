import { useState } from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({
  postsPagination: {
    next_page,
    results,
  },
  preview,
}: HomeProps) {
  const [posts, setPosts] = useState(results)
  const [nextPageUrl, setNextPageUrl] = useState(next_page)

  function handleLoadMorePosts() {
    fetch(nextPageUrl)
      .then(response => response.json())
      .then(data => {
        const newPosts: Post[] = data.results.map(result => ({
          uid: result.uid,
          first_publication_date: result.first_publication_date,
          data: {
            title: result.data.title,
            subtitle: result.data.subtitle,
            author: result.data.author,
          }
        }))

        setPosts([...posts, ...newPosts])
        setNextPageUrl(data.next_page)
      })
  }

  return (
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>
      <div className={`${commonStyles.pageContainer} ${styles.pageContainer}`}>
        <header className={styles.logoContainer}>
          <img src="./logo.svg" alt="logo" />
        </header>

        <main className={styles.postList}>
          {posts.map(post => (
            <Link href={`post/${post.uid}`} key={post.uid}>
              <a href="" className={styles.post}>
                <strong className={styles.title}>
                  {post.data.title}
                </strong>
                <p className={styles.subtitle}>
                  {post.data.subtitle}
                </p>
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
                </div>
              </a>
            </Link>
          ))}
        </main>

        {
          nextPageUrl !== null ? (
            <footer className={styles.morePostsContainer}>
              <button type="button" onClick={() => handleLoadMorePosts()}>
                Carregar mais posts
              </button>
            </footer>
          ) : ''
        }
      </div>
    </>
  )
}

export const getStaticProps: GetStaticProps<HomeProps> = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType('posts', {
    fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
    pageSize: 3,
    ref: previewData?.ref ?? null,
    
  });

  const posts: Post[] = postsResponse.results.map(result => ({
    uid: result.uid,
    first_publication_date: result.first_publication_date,
    data: {
      title: result.data.title,
      subtitle: result.data.subtitle,
      author: result.data.author,
    }
  }))

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
      preview,
    },
    revalidate: 60 * 30 // 30 minutes
  }
};