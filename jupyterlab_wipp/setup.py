from glob import glob
import setuptools

setuptools.setup(
    name="jupyterlab_wipp",
    version='0.3.0',
    url="https://github.com/labshare/jupyterlab-extensions/jupyterlab_wipp",
    author="Konstantin Taletskiy",
    description="WIPP integration with JupyterLab",
    packages=setuptools.find_packages(),
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    install_requires=[
        'notebook',
    ],
    zip_safe=False,
    include_package_data=True
)
