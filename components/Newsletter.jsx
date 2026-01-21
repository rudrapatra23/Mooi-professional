import React from 'react'
import Title from './Title'

const Newsletter = () => {
    return (
        <div className='flex flex-col items-center mx-4 my-36'>
            <Title title="Join Newsletter" description="Subscribe to get exclusive deals, new arrivals, and insider updates delivered straight to your inbox every week." visibleButton={false} />
            <div className='flex bg-white text-sm p-0 rounded-none w-full max-w-xl my-10 border border-black focus-within:ring-1 focus-within:ring-black transition-all'>
                <input className='flex-1 pl-6 outline-none text-black placeholder:text-gray-500 bg-transparent uppercase tracking-wider text-xs' type="text" placeholder='Enter your email address' />
                <button className='font-bold bg-black text-white px-8 py-4 rounded-none hover:bg-zinc-900 border-l border-white uppercase tracking-widest text-xs transition-all hover:text-yellow-500'>Subscribe</button>
            </div>
        </div>
    )
}

export default Newsletter